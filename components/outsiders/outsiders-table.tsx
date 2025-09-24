"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ApiClient } from "@/lib/api-client"

interface Outsider {
  id: number
  name: string
  phone: string | null
  company: string | null
  createdAt: string
  meals: any[]
}

interface OutsidersTableProps {
  search: string
}

export function OutsidersTable({ search }: OutsidersTableProps) {
  const [outsiders, setOutsiders] = useState<Outsider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOutsiders = async () => {
      setLoading(true)
      try {
        const response = await ApiClient.outsiders.getAll({ search })
        setOutsiders(response)
      } catch (error) {
        console.error("Error fetching outsiders:", error)
        setOutsiders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOutsiders()
  }, [search])

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Loading Outsiders...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>Outsiders ({outsiders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Meals Count</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outsiders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No outsiders found.
                </TableCell>
              </TableRow>
            ) : (
              outsiders.map((outsider) => (
                <TableRow key={outsider.id}>
                  <TableCell className="font-medium">{outsider.name}</TableCell>
                  <TableCell>{outsider.phone || 'Not Set'}</TableCell>
                  <TableCell>{outsider.company || 'Not Set'}</TableCell>
                  <TableCell>{outsider.meals.length}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Outsider
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}