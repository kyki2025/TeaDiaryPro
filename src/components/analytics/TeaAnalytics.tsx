/**
 * 茶叶数据分析组件
 * 展示品茶统计图表和趋势分析
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TeaRecord } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Coffee, Star, Calendar } from 'lucide-react';

interface TeaAnalyticsProps {
  records: TeaRecord[];
}

const TeaAnalytics: React.FC<TeaAnalyticsProps> = ({ records }) => {
  /**
   * 计算统计数据
   */
  const analytics = useMemo(() => {
    if (records.length === 0) return null;

    // 茶类型分布
    const typeDistribution = records.reduce((acc, record) => {
      acc[record.teaType] = (acc[record.teaType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeData = Object.entries(typeDistribution).map(([type, count], index) => ({
      name: type,
      value: count,
      percentage: ((count / records.length) * 100).toFixed(1),
      color: `hsl(${120 + index * 40}, 60%, 50%)`
    }));

    // 评分分布
    const ratingData = [1, 2, 3, 4, 5].map(rating => ({
      rating: `${rating}星`,
      count: records.filter(r => r.rating === rating).length
    }));

    // 月度品茶趋势
    const monthlyData = records.reduce((acc, record) => {
      const month = new Date(record.date).toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trendData = Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, count]) => ({ month, count }));

    // 平均评分
    const avgRating = (records.reduce((sum, r) => sum + r.rating, 0) / records.length).toFixed(1);

    // 最喜欢的茶类
    const favoriteType = Object.entries(typeDistribution)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      typeData,
      ratingData,
      trendData,
      avgRating,
      favoriteType,
      totalRecords: records.length
    };
  }, [records]);

  if (!analytics || records.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无数据，开始记录您的品茶体验吧！</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{analytics.totalRecords}</p>
                <p className="text-gray-600">总记录数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{analytics.avgRating}</p>
                <p className="text-gray-600">平均评分</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-brown-600" />
              <div className="ml-4">
                <p className="text-lg font-bold">{analytics.favoriteType}</p>
                <p className="text-gray-600">最爱茶类</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{analytics.trendData.length}</p>
                <p className="text-gray-600">活跃月份</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 茶类型分布饼图 */}
        <Card>
          <CardHeader>
            <CardTitle>茶类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 评分分布柱状图 */}
        <Card>
          <CardHeader>
            <CardTitle>评分分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.ratingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 品茶趋势图 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>月度品茶趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeaAnalytics;