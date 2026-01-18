"use client";

import { useState, useCallback } from "react";
import {
  parseUserInput,
  isValidPlaceId,
  isGoogleMapsUrl,
} from "@/lib/google-maps";

interface PlaceIdInputProps {
  value: string;
  onChange: (placeId: string, storeInfo?: StoreInfo) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

interface StoreInfo {
  name: string;
  address: string;
  rating?: number;
  reviewCount?: number;
}

/**
 * Place ID 入力コンポーネント
 *
 * Google Maps URL を貼り付けると自動で Place ID を抽出
 * Place ID を直接入力することも可能
 */
export function PlaceIdInput({
  value,
  onChange,
  onError,
  disabled = false,
}: PlaceIdInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<{
    placeId: string | null;
    name?: string;
  } | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  const handleInputChange = useCallback(
    async (input: string) => {
      setInputValue(input);
      setExtractedInfo(null);
      setStoreInfo(null);

      if (!input.trim()) {
        return;
      }

      // URL or Place ID を解析
      const result = parseUserInput(input);
      setExtractedInfo(result);

      if (result.placeId) {
        onChange(result.placeId);

        // Place ID が取得できたら店舗情報も取得を試みる
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/places/details?placeId=${encodeURIComponent(result.placeId)}`
          );
          if (response.ok) {
            const data = await response.json();
            setStoreInfo(data);
            onChange(result.placeId, data);
          }
        } catch (error) {
          console.error("Failed to fetch place details:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (isGoogleMapsUrl(input)) {
        // URL だけど Place ID が抽出できなかった
        onError?.("このURLからPlace IDを抽出できませんでした。別のURLを試すか、Place IDを直接入力してください。");
      }
    },
    [onChange, onError]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData("text");
      // ペーストされたテキストを処理
      setTimeout(() => handleInputChange(pastedText), 0);
    },
    [handleInputChange]
  );

  return (
    <div className="space-y-3">
      {/* 入力フィールド */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Google Maps URL または Place ID
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder="https://www.google.com/maps/place/... または ChIJ..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
        <p className="mt-1 text-xs text-gray-500">
          Google Maps で店舗を開き、URLをコピーして貼り付けてください
        </p>
      </div>

      {/* 抽出結果表示 */}
      {extractedInfo && (
        <div className="p-3 bg-gray-50 rounded-md">
          {extractedInfo.placeId ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Place ID 検出
                </span>
                {isLoading && (
                  <span className="text-xs text-gray-500">店舗情報を取得中...</span>
                )}
              </div>
              <code className="block text-xs bg-white p-2 rounded border overflow-x-auto">
                {extractedInfo.placeId}
              </code>

              {/* 店舗情報 */}
              {storeInfo && (
                <div className="mt-2 p-2 bg-white rounded border">
                  <p className="font-medium">{storeInfo.name}</p>
                  <p className="text-sm text-gray-600">{storeInfo.address}</p>
                  {storeInfo.rating && (
                    <p className="text-sm text-gray-600">
                      ★ {storeInfo.rating} ({storeInfo.reviewCount}件)
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : extractedInfo.name ? (
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                店舗名のみ検出
              </span>
              <p className="mt-1 text-sm">{extractedInfo.name}</p>
              <p className="mt-1 text-xs text-gray-500">
                Place ID が見つかりませんでした。Google Maps で店舗の詳細ページを開いてURLをコピーしてください。
              </p>
            </div>
          ) : (
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Place ID 未検出
              </span>
              <p className="mt-1 text-xs text-gray-500">
                URLからPlace IDを抽出できませんでした。
              </p>
            </div>
          )}
        </div>
      )}

      {/* 現在設定済みの Place ID */}
      {value && value !== extractedInfo?.placeId && (
        <div className="p-2 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-700">
            設定済み Place ID: <code>{value}</code>
          </p>
        </div>
      )}

      {/* ヘルプ */}
      <details className="text-sm">
        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
          Place ID の取得方法
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded-md text-gray-700 space-y-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>Google Maps で店舗を検索</li>
            <li>店舗をクリックして詳細を表示</li>
            <li>ブラウザのアドレスバーから URL をコピー</li>
            <li>上の入力欄に貼り付け</li>
          </ol>
          <p className="text-xs text-gray-500 mt-2">
            URLの例: https://www.google.com/maps/place/店舗名/@35.6812,139.7671,...
          </p>
        </div>
      </details>
    </div>
  );
}

export default PlaceIdInput;
