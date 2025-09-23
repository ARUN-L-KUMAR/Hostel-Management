"use client"

import { useState, useEffect } from "react"
import { ProvisionsChartClient } from "./provisions-chart-client"
import { ApiClient } from "@/lib/api-client"

export function ProvisionsChart() {
  const [topProvisionsData, setTopProvisionsData] = useState<Array<{
    name: string
    cost: number
    usage: number
  }>>([])
  const [costDistributionData, setCostDistributionData] = useState<Array<{
    name: string
    value: number
    color: string
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true)
      try {
        const provisions = await ApiClient.provisions.getAll()

        // Calculate monthly usage and costs for December 2024
        const provisionsWithStats = provisions.map((provision: any) => {
          // Filter usage for December 2024
          const decemberUsage = provision.usage?.filter((usage: any) => {
            const usageDate = new Date(usage.date)
            return usageDate.getMonth() === 11 && usageDate.getFullYear() === 2024 // December is month 11
          }) || []

          const monthlyUsage = decemberUsage.reduce((sum: number, usageItem: any) => sum + Number(usageItem.quantity), 0)
          const monthlyCost = monthlyUsage * Number(provision.unitCost)

          return {
            name: provision.name,
            cost: monthlyCost,
            usage: monthlyUsage,
          }
        })

        // Sort by cost and take top 5
        const topData = provisionsWithStats
          .sort((a: any, b: any) => b.cost - a.cost)
          .slice(0, 5)

        // Calculate cost distribution by category (simplified categorization)
        const categoryMap: { [key: string]: { value: number; color: string } } = {
          "Grains & Cereals": { value: 0, color: "#2563eb" },
          "Vegetables": { value: 0, color: "#f97316" },
          "Dairy & Proteins": { value: 0, color: "#10b981" },
          "Spices & Others": { value: 0, color: "#8b5cf6" },
        }

        // Simple categorization based on item names
        provisionsWithStats.forEach((item: any) => {
          const name = item.name.toLowerCase()
          if (name.includes('rice') || name.includes('wheat') || name.includes('flour') || name.includes('ரிசி') || name.includes('கோதுமை')) {
            categoryMap["Grains & Cereals"].value += item.cost
          } else if (name.includes('vegetable') || name.includes('காய்கறி') || name.includes('கீரை')) {
            categoryMap["Vegetables"].value += item.cost
          } else if (name.includes('milk') || name.includes('dairy') || name.includes('egg') || name.includes('பால்') || name.includes('முட்டை')) {
            categoryMap["Dairy & Proteins"].value += item.cost
          } else {
            categoryMap["Spices & Others"].value += item.cost
          }
        })

        const distributionData = Object.entries(categoryMap)
          .filter(([_, data]) => data.value > 0)
          .map(([name, data]) => ({ name, value: data.value, color: data.color }))

        setTopProvisionsData(topData)
        setCostDistributionData(distributionData)
      } catch (error) {
        console.error("Error fetching chart data:", error)
        setTopProvisionsData([])
        setCostDistributionData([])
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-100 rounded animate-pulse"></div>
        <div className="h-80 bg-slate-100 rounded animate-pulse"></div>
      </div>
    )
  }

  return <ProvisionsChartClient topProvisionsData={topProvisionsData} costDistributionData={costDistributionData} />
}
