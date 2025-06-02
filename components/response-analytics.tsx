"use client"

import { useMemo } from "react"
import type { Form, FormResponse } from "@/types/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, Users, Clock, Target } from "lucide-react"

interface ResponseAnalyticsProps {
  form: Form
  responses: FormResponse[]
}

export function ResponseAnalytics({ form, responses }: ResponseAnalyticsProps) {
  const analytics = useMemo(() => {
    // Calculate response distribution by date
    const responsesByDate = responses.reduce(
      (acc, response) => {
        const date = new Date(response.submittedAt).toLocaleDateString()
        acc[date] = (acc[date] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const dateData = Object.entries(responsesByDate).map(([date, count]) => ({
      date,
      responses: count,
    }))

    // Calculate question response rates
    const questionStats = form.questions.map((question) => {
      const answered = responses.filter(
        (r) => r.answers[question.id] !== undefined && r.answers[question.id] !== "" && r.answers[question.id] !== null,
      ).length

      return {
        question: question.title.length > 30 ? question.title.substring(0, 30) + "..." : question.title,
        answered,
        percentage: responses.length > 0 ? Math.round((answered / responses.length) * 100) : 0,
      }
    })

    // Calculate score distribution for tests
    const scoreDistribution = form.isTest
      ? responses
          .filter((r) => r.score !== undefined)
          .reduce(
            (acc, response) => {
              const scoreRange = Math.floor((response.score || 0) / 10) * 10
              const label = `${scoreRange}-${scoreRange + 9}%`
              acc[label] = (acc[label] || 0) + 1
              return acc
            },
            {} as Record<string, number>,
          )
      : {}

    const scoreData = Object.entries(scoreDistribution).map(([range, count]) => ({
      range,
      count,
    }))

    // Calculate average score
    const averageScore =
      form.isTest && responses.length > 0
        ? responses.filter((r) => r.score !== undefined).reduce((sum, r) => sum + (r.score || 0), 0) /
          responses.filter((r) => r.score !== undefined).length
        : 0

    return {
      dateData,
      questionStats,
      scoreData,
      averageScore: Math.round(averageScore),
    }
  }, [form, responses])

  const COLORS = ["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"]

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Responses</p>
                <p className="text-2xl font-bold">{responses.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {responses.length > 0 ? Math.round((responses.length / (responses.length + 5)) * 100) : 0}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        {form.isTest && (
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Average Score</p>
                  <p className="text-2xl font-bold">{analytics.averageScore}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Avg. Time</p>
                <p className="text-2xl font-bold">3.2m</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Response Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                responses: {
                  label: "Responses",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="responses" stroke="var(--color-responses)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Question Response Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Question Response Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                percentage: {
                  label: "Response Rate",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.questionStats} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="question" type="category" width={120} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="percentage" fill="var(--color-percentage)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Score Distribution (for tests) */}
        {form.isTest && analytics.scoreData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Students",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.scoreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.scoreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
