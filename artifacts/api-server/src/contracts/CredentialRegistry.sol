// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * MediBridge Global — Credential Registry
 *
 * Stores SHA-256 document hashes for clinic credentials on-chain.
 * Only the platform owner wallet can anchor credentials.
 * Patients can independently verify that a credential hash matches
 * the value on-chain without trusting MediBridge servers.
 *
 * Deploy to: Polygon Amoy testnet
 *   RPC:     https://rpc-amoy.polygon.technology
 *   ChainID: 80002
 */
contract CredentialRegistry {
    struct CredentialRecord {
        bytes32 documentHash;
        string issuer;
        uint256 timestamp;
        string credentialType;
    }

    mapping(string => CredentialRecord[]) private records;
    address public owner;

    event CredentialAnchored(
        string indexed entityId,
        bytes32 documentHash,
        string issuer,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorised");
        _;
    }

    function anchor(
        string calldata entityId,
        bytes32 documentHash,
        string calldata issuer,
        string calldata credentialType
    ) external onlyOwner {
        records[entityId].push(
            CredentialRecord({
                documentHash: documentHash,
                issuer: issuer,
                timestamp: block.timestamp,
                credentialType: credentialType
            })
        );
        emit CredentialAnchored(entityId, documentHash, issuer, block.timestamp);
    }

    function getRecords(string calldata entityId)
        external
        view
        returns (CredentialRecord[] memory)
    {
        return records[entityId];
    }

    function verify(string calldata entityId, bytes32 documentHash)
        external
        view
        returns (bool found, uint256 timestamp)
    {
        CredentialRecord[] memory recs = records[entityId];
        for (uint256 i = 0; i < recs.length; i++) {
            if (recs[i].documentHash == documentHash) {
                return (true, recs[i].timestamp);
            }
        }
        return (false, 0);
    }
}
