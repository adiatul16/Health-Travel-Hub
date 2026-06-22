// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MediBridgeLedger {
    address public owner;

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

    mapping(address => Clinic) public clinics;
    mapping(address => Doctor) public doctors;
    mapping(address => bool) public hasOnChainInteraction;

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

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

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
        return clinics[clinic].verified;
    }

    function verifyDoctor(
        address doctor,
        address clinic,
        string calldata license,
        uint256 expiry
    ) external onlyOwner {
        doctors[doctor] = Doctor(clinic, license, expiry, true);
        emit DoctorVerified(doctor, clinic, license, expiry);
    }

    function isDoctorVerified(address doctor) external view returns (bool) {
        return doctors[doctor].verified;
    }

    function addRecord(
        bytes32 dataHash,
        string calldata ref,
        string calldata phase
    ) external {
        hasOnChainInteraction[msg.sender] = true;
        emit RecordAdded(msg.sender, dataHash, ref, phase, block.timestamp);
    }

    function getRecordCount() external view returns (uint256) {
        return 0; // Simplified
    }

    function grantConsent(address doctor, bytes32 recordHash) external {
        hasOnChainInteraction[msg.sender] = true;
        emit ConsentGranted(msg.sender, doctor, recordHash);
    }

    function revokeConsent(address doctor, bytes32 recordHash) external {
        hasOnChainInteraction[msg.sender] = true;
        emit ConsentRevoked(msg.sender, doctor, recordHash);
    }

    function hasConsent(
        address patient,
        address doctor,
        bytes32 recordHash
    ) external pure returns (bool) {
        return false; // Simplified for demo
    }

    function addReview(
        address clinic,
        uint8 rating,
        string calldata comment
    ) external {
        require(hasOnChainInteraction[msg.sender], "Not eligible");
        emit ReviewAdded(msg.sender, clinic, rating, comment, block.timestamp);
    }

    function getReviewCount(address clinic) external view returns (uint256) {
        return 0; // Simplified for demo
    }
}
