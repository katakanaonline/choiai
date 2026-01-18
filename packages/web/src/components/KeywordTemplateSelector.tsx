"use client";

import { useState, useMemo } from "react";
import { KEYWORD_TEMPLATES, expandKeywordTemplate } from "@/lib/google-maps";

interface KeywordTemplateSelectorProps {
  area: string;
  onAreaChange: (area: string) => void;
  selectedKeywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
}

/**
 * 業種別キーワードテンプレート選択コンポーネント
 *
 * 業種を選ぶと、その業種に適したキーワードが自動生成される
 */
export function KeywordTemplateSelector({
  area,
  onAreaChange,
  selectedKeywords,
  onKeywordsChange,
}: KeywordTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customKeyword, setCustomKeyword] = useState("");

  // テンプレートからキーワードを展開
  const templateKeywords = useMemo(() => {
    if (!selectedTemplate || !area) return [];
    return expandKeywordTemplate(selectedTemplate, area);
  }, [selectedTemplate, area]);

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    if (templateKey && area && templateKey !== "custom") {
      const keywords = expandKeywordTemplate(templateKey, area);
      onKeywordsChange(keywords);
    }
  };

  const handleAddKeyword = (keyword: string) => {
    if (keyword && !selectedKeywords.includes(keyword)) {
      onKeywordsChange([...selectedKeywords, keyword]);
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    onKeywordsChange(selectedKeywords.filter((k) => k !== keyword));
  };

  const handleAddCustomKeyword = () => {
    if (customKeyword.trim()) {
      handleAddKeyword(customKeyword.trim());
      setCustomKeyword("");
    }
  };

  return (
    <div className="space-y-4">
      {/* 地域入力 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          地域・エリア名
        </label>
        <input
          type="text"
          value={area}
          onChange={(e) => onAreaChange(e.target.value)}
          placeholder="例: 新宿、渋谷、池袋"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          店舗周辺の地域名を入力してください
        </p>
      </div>

      {/* 業種選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          業種を選択
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(KEYWORD_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => handleTemplateSelect(key)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                selectedTemplate === key
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      {/* テンプレートから生成されるキーワード */}
      {templateKeywords.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            おすすめキーワード
          </label>
          <div className="flex flex-wrap gap-2">
            {templateKeywords.map((keyword) => {
              const isSelected = selectedKeywords.includes(keyword);
              return (
                <button
                  key={keyword}
                  onClick={() =>
                    isSelected
                      ? handleRemoveKeyword(keyword)
                      : handleAddKeyword(keyword)
                  }
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    isSelected
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {isSelected ? "✓ " : "+ "}
                  {keyword}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* カスタムキーワード追加 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          カスタムキーワードを追加
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustomKeyword()}
            placeholder="キーワードを入力"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddCustomKeyword}
            disabled={!customKeyword.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            追加
          </button>
        </div>
      </div>

      {/* 選択中のキーワード一覧 */}
      {selectedKeywords.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            監視キーワード ({selectedKeywords.length}件)
          </label>
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex flex-wrap gap-2">
              {selectedKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                >
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KeywordTemplateSelector;
