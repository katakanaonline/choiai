"use client";

import { useState, useCallback } from "react";

interface GbpDraft {
  id: string;
  snsPostId: string;
  platform: "x" | "instagram";
  originalContent: string;
  rewrittenContent: string;
  mediaUrls: string[];
  postedAt: string;
  status: "pending" | "approved" | "rejected" | "posted";
}

interface SnsToGbpApprovalProps {
  drafts: GbpDraft[];
  onApprove: (id: string, content: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onEdit: (id: string, content: string) => Promise<void>;
}

/**
 * SNS→GBP投稿承認コンポーネント
 *
 * SNS投稿とGBP向けリライト案を並べて表示
 * 編集・承認・却下が可能
 */
export function SnsToGbpApproval({
  drafts,
  onApprove,
  onReject,
  onEdit,
}: SnsToGbpApprovalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pendingDrafts = drafts.filter((d) => d.status === "pending");
  const approvedDrafts = drafts.filter((d) => d.status === "approved");

  const handleStartEdit = (draft: GbpDraft) => {
    setEditingId(draft.id);
    setEditContent(draft.rewrittenContent);
  };

  const handleSaveEdit = async (id: string) => {
    setProcessingId(id);
    try {
      await onEdit(id, editContent);
      setEditingId(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (draft: GbpDraft) => {
    setProcessingId(draft.id);
    try {
      const content = editingId === draft.id ? editContent : draft.rewrittenContent;
      await onApprove(draft.id, content);
      setEditingId(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await onReject(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopy = useCallback(async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // フォールバック
      const textArea = document.createElement("textarea");
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const getPlatformIcon = (platform: "x" | "instagram") => {
    return platform === "x" ? "𝕏" : "📷";
  };

  const getPlatformLabel = (platform: "x" | "instagram") => {
    return platform === "x" ? "X投稿" : "Instagram投稿";
  };

  return (
    <div className="space-y-6">
      {/* 承認待ち */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          承認待ち ({pendingDrafts.length}件)
        </h2>

        {pendingDrafts.length === 0 ? (
          <p className="text-gray-500 text-sm">承認待ちの投稿はありません</p>
        ) : (
          <div className="space-y-4">
            {pendingDrafts.map((draft) => (
              <div
                key={draft.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* ヘッダー */}
                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getPlatformIcon(draft.platform)}</span>
                    <span className="text-sm font-medium">
                      {getPlatformLabel(draft.platform)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(draft.postedAt).toLocaleString("ja-JP")}
                    </span>
                  </div>
                </div>

                {/* コンテンツ比較 */}
                <div className="grid md:grid-cols-2 gap-4 p-4">
                  {/* 元の投稿 */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">
                      元の投稿
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{draft.originalContent}</p>
                      {draft.mediaUrls.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {draft.mediaUrls.slice(0, 3).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          ))}
                          {draft.mediaUrls.length > 3 && (
                            <span className="text-xs text-gray-500 self-center">
                              +{draft.mediaUrls.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* GBP向けリライト */}
                  <div>
                    <h4 className="text-xs font-medium text-blue-600 mb-2">
                      GBP向けリライト案
                    </h4>
                    {editingId === draft.id ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-32 p-3 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={1500}
                      />
                    ) : (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm whitespace-pre-wrap">
                          {draft.rewrittenContent}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {editingId === draft.id
                        ? `${editContent.length}/1500文字`
                        : `${draft.rewrittenContent.length}/1500文字`}
                    </p>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="bg-gray-50 px-4 py-3 flex justify-end gap-2">
                  {editingId === draft.id ? (
                    <>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() => handleSaveEdit(draft.id)}
                        disabled={processingId === draft.id}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        保存
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleReject(draft.id)}
                        disabled={processingId === draft.id}
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      >
                        却下
                      </button>
                      <button
                        onClick={() => handleStartEdit(draft)}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleApprove(draft)}
                        disabled={processingId === draft.id}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingId === draft.id ? "処理中..." : "承認"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 承認済み（コピー待ち） */}
      {approvedDrafts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            承認済み - GBPに投稿してください ({approvedDrafts.length}件)
          </h2>

          <div className="space-y-4">
            {approvedDrafts.map((draft) => (
              <div
                key={draft.id}
                className="border border-green-200 bg-green-50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">
                      {draft.rewrittenContent}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleCopy(draft.rewrittenContent, draft.id)}
                      className={`px-4 py-2 text-sm rounded-lg transition-all ${
                        copiedId === draft.id
                          ? "bg-green-600 text-white"
                          : "bg-white border border-green-300 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {copiedId === draft.id ? "コピー済み" : "コピー"}
                    </button>
                    <a
                      href="https://business.google.com/posts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                    >
                      GBPで投稿
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default SnsToGbpApproval;
