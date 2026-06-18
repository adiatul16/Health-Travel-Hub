import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface CredentialData {
  id: number;
  credentialType: string;
  issuingBody: string;
  issueDate: string;
  documentName?: string | null;
  documentHash?: string | null;
  onChainTxHash?: string | null;
  onChainTimestamp?: string | null;
  anchoredAt?: string | null;
  polygonScanUrl?: string | null;
  blockchainConfigured?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="ml-2 text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex-shrink-0"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function VerifyHashPanel({ credential }: { credential: CredentialData }) {
  const [inputHash, setInputHash] = useState("");
  const [result, setResult] = useState<{
    localMatch: boolean;
    onChainMatch: boolean | null;
    computedHash: string;
    tamperDetected: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!inputHash.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/credentials/${credential.id}/check-hash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputHash: inputHash.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Verify your copy
      </p>
      <p className="text-xs text-gray-500 mb-3">
        If you have the original document, compute its SHA-256 hash and paste it
        below to check for tampering.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputHash}
          onChange={(e) => setInputHash(e.target.value)}
          placeholder="0x…sha256 hash…"
          className="flex-1 text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <button
          onClick={verify}
          disabled={loading || !inputHash.trim()}
          className="px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "…" : "Check"}
        </button>
      </div>
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${
            result.tamperDetected
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {result.tamperDetected ? (
            <>
              <span className="font-bold">⚠️ Mismatch detected.</span> The hash
              you provided does not match the anchored record. The document may
              have been modified.
            </>
          ) : (
            <>
              <span className="font-bold">✅ Verified.</span> Hash matches the
              on-chain record perfectly — no tampering detected.
            </>
          )}
          {result.onChainMatch === null && !result.tamperDetected && (
            <span className="block mt-1 text-gray-500">
              (On-chain verification unavailable — matched against stored hash)
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}

function CredentialModal({
  credential,
  onClose,
}: {
  credential: CredentialData;
  onClose: () => void;
}) {
  const anchorDate = credential.onChainTimestamp
    ? new Date(credential.onChainTimestamp).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">
            ⛓️
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{credential.credentialType}</h3>
            <p className="text-xs text-emerald-600 font-semibold">Verified On-Chain</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-start gap-4">
            <span className="text-gray-500 flex-shrink-0">Issuing body</span>
            <span className="font-medium text-right">{credential.issuingBody}</span>
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-gray-500 flex-shrink-0">Issue date</span>
            <span className="font-medium">{credential.issueDate}</span>
          </div>
          {credential.documentName && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-500 flex-shrink-0">Document</span>
              <span className="font-medium text-right">{credential.documentName}</span>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-3 mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                SHA-256 Hash
              </span>
              {credential.documentHash && (
                <CopyButton text={credential.documentHash} />
              )}
            </div>
            <p className="font-mono text-xs text-gray-700 break-all leading-relaxed">
              {credential.documentHash ?? "—"}
            </p>
          </div>

          {anchorDate && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-500 flex-shrink-0">Anchored</span>
              <span className="font-medium">{anchorDate}</span>
            </div>
          )}

          {credential.polygonScanUrl && (
            <a
              href={credential.polygonScanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 mt-2 px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
            >
              <span>🔗</span>
              <span>View transaction on PolygonScan</span>
              <span className="ml-auto">↗</span>
            </a>
          )}

          {credential.documentHash && <VerifyHashPanel credential={credential} />}
        </div>

        <p className="mt-5 text-xs text-gray-400 text-center">
          This hash is permanently recorded on the Polygon blockchain.
          No party — including MediBridge — can alter it.
        </p>
      </motion.div>
    </div>
  );
}

export function CredentialBadge({ credential }: { credential: CredentialData }) {
  const [open, setOpen] = useState(false);
  const isAnchored = !!credential.onChainTxHash;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 ${
          isAnchored
            ? "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
            : "bg-amber-100 text-amber-700 border border-amber-200"
        }`}
        title={isAnchored ? "View blockchain verification" : "Pending verification"}
      >
        <span>{isAnchored ? "⛓️" : "⏳"}</span>
        <span>{isAnchored ? "Verified On-Chain" : "Pending"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <CredentialModal credential={credential} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
