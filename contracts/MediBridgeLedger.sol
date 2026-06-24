// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MediBridgeLedger
 * @notice On-chain trust layer for MediBridge Global. Stores SHA-256 hashes
 *   of medical records, clinic/doctor verifications, patient consent,
 *   and verified reviews. No raw health data lives on-chain.
 */
contract MediBridgeLedger {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /* ─── Events ─── */
    event ClinicVerified(
        address indexed clinic,
        string name,
        string accreditation,
        uint256 expiry
    );
    event DoctorVerified(
        address indexed doctor,
        address indexed clinic,
        string license,
        uint256 expiry
    );
    event RecordAdded(
        address indexed patient,
        bytes32 indexed dataHash,
        string ref,
        string phase,
        uint256 timestamp
    );
    event ConsentGranted(
        address indexed patient,
        address indexed doctor,
        bytes32 indexed recordHash
    );
    event ConsentRevoked(
        address indexed patient,
        address indexed doctor,
        bytes32 indexed recordHash
    );
    event ReviewAdded(
        address indexed patient,
        address indexed clinic,
        uint8 rating,
        string comment,
        uint256 timestamp
    );

    /* ─── Data structures ─── */
    struct Clinic {
        string name;
        string accreditation;
        uint256 expiry;
        bool verified;
    }

    struct Doctor {
        address clinic;
        string license;
        uint256 expiry;
        bool verified;
    }

    struct Record {
        address patient;
        bytes32 dataHash;
        string ref;
        string phase;
        uint256 timestamp;
    }

    struct Consent {
        bool granted;
        uint256 timestamp;
    }

    struct Review {
        address patient;
        uint8 rating;
        string comment;
        uint256 timestamp;
    }

    /* ─── State ─── */
    mapping(address => Clinic) public clinics;
    mapping(address => Doctor) public doctors;
    Record[] public records;
    mapping(address => bool) public hasOnChainInteraction;

    // patient => doctor => recordHash => Consent
    mapping(address => mapping(address => mapping(bytes32 => Consent))) public consent;

    // clinic => reviews
    mapping(address => Review[]) public reviews;

    /* ─── Modifiers ─── */
    modifier onlyVerifiedClinic() {
        require(clinics[msg.sender].verified, "Caller is not a verified clinic");
        _;
    }

    /* ─── Clinic verification (owner only) ─── */
    function verifyClinic(
        address clinic,
        string calldata name,
        string calldata accreditation,
        uint256 expiry
    ) external onlyOwner {
        clinics[clinic] = Clinic(name, accreditation, expiry, true);
        emit ClinicVerified(clinic, name, accreditation, expiry);
    }

    function isClinicVerified(address clinic) external view returns (bool) {
        return clinics[clinic].verified && clinics[clinic].expiry > block.timestamp;
    }

    /* ─── Doctor verification (owner or verified clinic) ─── */
    function verifyDoctor(
        address doctor,
        address clinic,
        string calldata license,
        uint256 expiry
    ) external {
        require(
            msg.sender == owner || clinics[msg.sender].verified,
            "Not authorized"
        );
        doctors[doctor] = Doctor(clinic, license, expiry, true);
        emit DoctorVerified(doctor, clinic, license, expiry);
    }

    function isDoctorVerified(address doctor) external view returns (bool) {
        return doctors[doctor].verified && doctors[doctor].expiry > block.timestamp;
    }

    /* ─── Medical records (patient stores hash) ─── */
    function addRecord(
        bytes32 dataHash,
        string calldata ref,
        string calldata phase
    ) external {
        records.push(Record(msg.sender, dataHash, ref, phase, block.timestamp));
        hasOnChainInteraction[msg.sender] = true;
        emit RecordAdded(msg.sender, dataHash, ref, phase, block.timestamp);
    }

    /// @notice Same as addRecord, but for use by the trusted backend relayer,
    ///   which signs all transactions itself and must specify the real patient.
    function addRecordFor(
        address patient,
        bytes32 dataHash,
        string calldata ref,
        string calldata phase
    ) external onlyOwner {
        records.push(Record(patient, dataHash, ref, phase, block.timestamp));
        hasOnChainInteraction[patient] = true;
        emit RecordAdded(patient, dataHash, ref, phase, block.timestamp);
    }

    function getRecordCount() external view returns (uint256) {
        return records.length;
    }

    /* ─── Consent management ─── */
    function grantConsent(address doctor, bytes32 recordHash) external {
        consent[msg.sender][doctor][recordHash] = Consent(true, block.timestamp);
        emit ConsentGranted(msg.sender, doctor, recordHash);
    }

    function revokeConsent(address doctor, bytes32 recordHash) external {
        consent[msg.sender][doctor][recordHash] = Consent(false, block.timestamp);
        emit ConsentRevoked(msg.sender, doctor, recordHash);
    }

    /// @notice Relayer variants of grant/revokeConsent — see addRecordFor.
    function grantConsentFor(address patient, address doctor, bytes32 recordHash) external onlyOwner {
        consent[patient][doctor][recordHash] = Consent(true, block.timestamp);
        emit ConsentGranted(patient, doctor, recordHash);
    }

    function revokeConsentFor(address patient, address doctor, bytes32 recordHash) external onlyOwner {
        consent[patient][doctor][recordHash] = Consent(false, block.timestamp);
        emit ConsentRevoked(patient, doctor, recordHash);
    }

    function hasConsent(
        address patient,
        address doctor,
        bytes32 recordHash
    ) external view returns (bool) {
        return consent[patient][doctor][recordHash].granted;
    }

    /* ─── Reviews (only patients with on-chain interaction) ─── */
    function addReview(
        address clinic,
        uint8 rating,
        string calldata comment
    ) external {
        require(hasOnChainInteraction[msg.sender], "Must have on-chain interaction");
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");
        reviews[clinic].push(Review(msg.sender, rating, comment, block.timestamp));
        emit ReviewAdded(msg.sender, clinic, rating, comment, block.timestamp);
    }

    /// @notice Relayer variant of addReview — see addRecordFor.
    function addReviewFor(
        address patient,
        address clinic,
        uint8 rating,
        string calldata comment
    ) external onlyOwner {
        require(hasOnChainInteraction[patient], "Must have on-chain interaction");
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");
        reviews[clinic].push(Review(patient, rating, comment, block.timestamp));
        emit ReviewAdded(patient, clinic, rating, comment, block.timestamp);
    }

    function getReviewCount(address clinic) external view returns (uint256) {
        return reviews[clinic].length;
    }
}
