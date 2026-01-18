"use client";

interface RankingData {
  keyword: string;
  currentRank: number;
  previousRank: number;
  weekAgoRank: number;
}

interface Props {
  rankings: RankingData[];
}

export function RankingTable({ rankings }: Props) {
  const getRankChange = (current: number, previous: number) => {
    const diff = previous - current;
    if (diff > 0) return { text: `↑${diff}`, color: "text-green-600" };
    if (diff < 0) return { text: `↓${Math.abs(diff)}`, color: "text-red-600" };
    return { text: "→", color: "text-gray-400" };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
              キーワード
            </th>
            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
              現在順位
            </th>
            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
              前日比
            </th>
            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
              1週間前比
            </th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((ranking, index) => {
            const dayChange = getRankChange(ranking.currentRank, ranking.previousRank);
            const weekChange = getRankChange(ranking.currentRank, ranking.weekAgoRank);

            return (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4 text-sm text-gray-900">
                  {ranking.keyword}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold">
                    {ranking.currentRank}
                  </span>
                </td>
                <td className={`py-4 px-4 text-center font-medium ${dayChange.color}`}>
                  {dayChange.text}
                </td>
                <td className={`py-4 px-4 text-center font-medium ${weekChange.color}`}>
                  {weekChange.text}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
