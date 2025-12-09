"use client";

import { useEffect, useState } from "react";
import { useMyOfficeStore } from "../_store/myoffice-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Loader2,
  Search,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { calculateOverallStatus } from "@/lib/request-status";
import { Request } from "../_types";
import { RequestDetail } from "./request-detail";

export function RequestsSection() {
  const {
    office,
    requests,
    isLoadingRequests,
    page,
    pageSize,
    total,
    totalPages,
    search,
    statusFilter,
    fetchRequests,
    setPage,
    setPageSize,
    setSearch,
    setStatusFilter,
  } = useMyOfficeStore();
  const [localSearch, setLocalSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (office) {
      fetchRequests();
    }
  }, [office, fetchRequests, page, pageSize, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearch]);

  const getStatusBadge = (request: Request) => {
    const status = calculateOverallStatus(
      request.statusbystaff,
      request.statusbyadmin
    );
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (!office) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please assign or create an office first to manage requests.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Requests</h2>
          <p className="text-muted-foreground text-sm">
            Manage requests for {office.name}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRequests()}
          disabled={isLoadingRequests}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${
              isLoadingRequests ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      {isLoadingRequests ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
              <p className="text-sm text-muted-foreground">
                No requests match your filters.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Staff Approval</TableHead>
                    <TableHead>Admin Approval</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.service?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {request.user?.username || "N/A"}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {request.user?.phoneNumber || ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.date), "MM/dd/yyyy")}
                      </TableCell>
                      <TableCell>{getStatusBadge(request)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.statusbystaff === "approved"
                              ? "default"
                              : request.statusbystaff === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {request.statusbystaff}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.statusbyadmin === "approved"
                              ? "default"
                              : request.statusbyadmin === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {request.statusbyadmin}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize + 1).toLocaleString()}-
                {Math.min(page * pageSize, total).toLocaleString()} of{" "}
                {total.toLocaleString()} requests
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Request Detail Dialog */}
      <RequestDetail
        request={selectedRequest}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
