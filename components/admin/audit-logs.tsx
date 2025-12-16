"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Search, RefreshCw, User, FileText, Clock, Eye, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

interface AuditLog {
  id: string
  userId: string | null
  user?: {
    name: string
    email: string
  }
  action: string
  entity: string
  entityId: string | null
  oldData: any
  newData: any
  timestamp: string
  isGroup?: boolean
  groupCount?: number
  groupLogs?: AuditLog[]
}

interface AuditLogsResponse {
  logs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [groupedLogs, setGroupedLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [entityFilter, setEntityFilter] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [groupSimilar, setGroupSimilar] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30) // 30 days ago
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const today = new Date()
    // Add one day to include today in the range
    today.setDate(today.getDate() + 1)
    return today.toISOString().split('T')[0]
  })

  const fetchLogs = async (page = 1, search = "", entity = "", action = "", start = "", end = "") => {
    try {
      setLoading(true)
      // Use a much larger limit for grouped content to reduce pagination
      const limit = groupSimilar ? "1000" : "50"
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit
      })

      if (search) params.append("search", search)
      if (entity && entity !== "all") params.append("entity", entity)
      if (action && action !== "all") params.append("action", action)
      if (start) params.append("startDate", start)
      if (end) params.append("endDate", end)

      const response = await fetch(`/api/audit-logs?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs")
      }

      const data: AuditLogsResponse = await response.json()
      setLogs(data.logs)
      setCurrentPage(data.pagination.page)
      setTotalPages(data.pagination.pages)
      setTotalLogs(data.pagination.total)
    } catch (error) {
      console.error("Error fetching audit logs:", error)
      toast.error("Failed to fetch audit logs")
    } finally {
      setLoading(false)
    }
  }

  // Group similar consecutive actions from the same user
  const groupLogs = (logs: AuditLog[]) => {
    if (!groupSimilar) return logs.map(log => ({ ...log, isGroup: false, groupCount: 1 }))

    const groups = []
    let currentGroup: AuditLog[] = []

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i]
      const prevLog = logs[i - 1]

      if (prevLog &&
        prevLog.userId === log.userId &&
        prevLog.action === log.action &&
        prevLog.entity === log.entity &&
        Math.abs(new Date(log.timestamp).getTime() - new Date(prevLog.timestamp).getTime()) < 5 * 60 * 1000) { // 5 minutes
        currentGroup.push(log)
      } else {
        if (currentGroup.length > 0) {
          // Only create a group if there are multiple items
          if (currentGroup.length > 1) {
            groups.push({
              ...currentGroup[0],
              isGroup: true,
              groupCount: currentGroup.length,
              groupLogs: currentGroup,
              timestamp: currentGroup[currentGroup.length - 1].timestamp, // Use latest timestamp
              id: `group_${currentGroup[0].id}_${currentGroup.length}` // Unique ID for group
            })
          } else {
            // Single item, don't group
            groups.push({
              ...currentGroup[0],
              isGroup: false,
              groupCount: 1
            })
          }
        }
        currentGroup = [log]
      }
    }

    if (currentGroup.length > 0) {
      if (currentGroup.length > 1) {
        groups.push({
          ...currentGroup[0],
          isGroup: true,
          groupCount: currentGroup.length,
          groupLogs: currentGroup,
          timestamp: currentGroup[currentGroup.length - 1].timestamp,
          id: `group_${currentGroup[0].id}_${currentGroup.length}`
        })
      } else {
        groups.push({
          ...currentGroup[0],
          isGroup: false,
          groupCount: 1
        })
      }
    }

    return groups
  }

  useEffect(() => {
    fetchLogs(1, searchTerm, entityFilter, actionFilter, startDate, endDate)
  }, [startDate, endDate])

  useEffect(() => {
    if (logs.length > 0) {
      setGroupedLogs(groupLogs(logs))
    }
  }, [logs, groupSimilar])

  // Auto-fetch when component mounts or date filters change
  useEffect(() => {
    fetchLogs(1, searchTerm, entityFilter, actionFilter, startDate, endDate)
  }, [startDate, endDate])

  const handleSearch = () => {
    fetchLogs(1, searchTerm, entityFilter, actionFilter, startDate, endDate)
  }

  const handlePageChange = (page: number) => {
    fetchLogs(page, searchTerm, entityFilter, actionFilter, startDate, endDate)
  }

  const handleDateFilter = () => {
    fetchLogs(1, searchTerm, entityFilter, actionFilter, startDate, endDate)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'default'
      case 'update':
        return 'secondary'
      case 'delete':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getEntityIcon = (entity: string) => {
    switch (entity.toLowerCase()) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'student':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            Track all system activities and changes made by users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-48"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-48"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleDateFilter} variant="outline">
                  Filter by Date
                </Button>
              </div>
            </div>

            {/* Search and Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                  <SelectItem value="provision">Provisions</SelectItem>
                  <SelectItem value="mealRecord">Meal Records</SelectItem>
                  <SelectItem value="feeRecord">Fee Records</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={handleSearch} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button
                  onClick={() => {
                    setGroupSimilar(!groupSimilar)
                    // Re-fetch with current filters when toggling grouping
                    fetchLogs(currentPage, searchTerm, entityFilter, actionFilter, startDate, endDate)
                  }}
                  variant={groupSimilar ? "default" : "outline"}
                >
                  {groupSimilar ? "Grouped" : "Ungrouped"}
                </Button>
                <Button
                  onClick={() => fetchLogs(currentPage, searchTerm, entityFilter, actionFilter, startDate, endDate)}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {groupSimilar ? (
                <>
                  Showing {groupedLogs.length} grouped entries of {totalLogs} logs
                </>
              ) : (
                <>
                  Showing {logs.length} of {totalLogs} logs
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} • {groupSimilar ? "1000" : "50"} per page
            </div>
          </div>

          {/* Logs Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  (groupSimilar ? groupedLogs : logs.map(log => ({ ...log, isGroup: false, groupCount: 1 }))).map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span>{formatTimestamp(log.timestamp)}</span>
                          {log.isGroup && (
                            <span className="text-xs text-muted-foreground">
                              +{log.groupCount - 1} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <div className="font-medium">{log.user.name}</div>
                            <div className="text-xs text-muted-foreground">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                          {log.isGroup && (
                            <span className="ml-1 text-xs">×{log.groupCount}</span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEntityIcon(log.entity)}
                          <span className="capitalize">{log.entity}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entityId || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="max-w-xs truncate text-xs">
                            {log.oldData && log.newData ? (
                              <span>Updated record</span>
                            ) : log.newData ? (
                              <span>Created new record</span>
                            ) : log.oldData ? (
                              <span>Deleted record</span>
                            ) : (
                              <span>System action</span>
                            )}
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-background border-border">
                              <DialogHeader>
                                <DialogTitle>Audit Log Details</DialogTitle>
                              </DialogHeader>
                              {selectedLog && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Timestamp</label>
                                      <p className="text-sm text-muted-foreground">
                                        {formatTimestamp(selectedLog.timestamp)}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">User</label>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedLog.user?.name || 'System'} ({selectedLog.user?.email || 'N/A'})
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Action</label>
                                      <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                                        {selectedLog.action}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Entity</label>
                                      <p className="text-sm text-muted-foreground capitalize">
                                        {selectedLog.entity}
                                      </p>
                                    </div>
                                  </div>

                                  {selectedLog.oldData && (
                                    <div>
                                      <label className="text-sm font-medium">Previous Data</label>
                                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                        {JSON.stringify(selectedLog.oldData, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {selectedLog.newData && (
                                    <div>
                                      <label className="text-sm font-medium">New Data</label>
                                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                        {JSON.stringify(selectedLog.newData, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {log.isGroup && log.groupLogs && (
                                    <div>
                                      <label className="text-sm font-medium">Group Actions ({log.groupCount})</label>
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {log.groupLogs?.map((groupLog: AuditLog, index: number) => (
                                          <div key={index} className="text-xs bg-muted p-2 rounded">
                                            <div className="font-medium">
                                              {formatTimestamp(groupLog.timestamp)} - {groupLog.entityId}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-6">
              <div className="flex items-center gap-2">
                {currentPage > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                  >
                    First
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 7) {
                      pageNum = i + 1
                    } else if (currentPage <= 4) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i
                    } else {
                      pageNum = currentPage - 3 + i
                    }

                    const isActive = pageNum === currentPage

                    return (
                      <Button
                        key={pageNum}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-10 ${isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border-border text-foreground hover:bg-muted"
                          }`}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>

                {currentPage < totalPages && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    Last
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}