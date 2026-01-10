'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Plus, Calendar } from 'lucide-react'
import { getEnquiries } from '@/lib/api'
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns'

interface Enquiry {
  _id: string
  tokenId: string
  parentName: string
  childName: string
  mobile: string
  email: string
  grade: string
  status: 'new' | 'in_progress' | 'converted'
  createdAt: string
  slotBooked?: boolean
  bookedCount?: number
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-green-100 text-green-800'
}

const statusLabels = {
  new: 'New',
  in_progress: 'In Progress',
  converted: 'Converted'
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Fetch when filters or debounced search changes
  useEffect(() => {
    setPage(1)
    fetchEnquiries()
  }, [debouncedSearch, statusFilter, dateFilter, classFilter])

  // Fetch when page changes
  useEffect(() => {
    fetchEnquiries()
  }, [page])

  const fetchEnquiries = async () => {
    setLoading(true)
    const result = await getEnquiries({
      page,
      limit: 10,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined
    })

    if (result.success && result.data) {
      let filteredEnquiries = result.data.enquiries

      // Apply date filter client-side
      if (dateFilter) {
        const now = new Date()
        filteredEnquiries = filteredEnquiries.filter((enq: Enquiry) => {
          const enqDate = new Date(enq.createdAt)
          switch (dateFilter) {
            case 'today':
              return enqDate >= startOfDay(now)
            case 'week':
              return enqDate >= startOfWeek(now)
            case 'month':
              return enqDate >= startOfMonth(now)
            default:
              return true
          }
        })
      }

      // Apply class filter client-side
      if (classFilter) {
        filteredEnquiries = filteredEnquiries.filter((enq: Enquiry) =>
          enq.grade === classFilter
        )
      }

      setEnquiries(filteredEnquiries)
      setTotalPages(result.data.totalPages)
      setTotal(result.data.total)
    }
    setLoading(false)
  }

  // Get unique grades for filter
  const uniqueGrades = Array.from(new Set(enquiries.map(e => e.grade))).sort()

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enquiries</h2>
          <p className="text-gray-600">{total} total enquiries</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="input pl-10 w-full"
              placeholder="Search by Token ID or Mobile Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Filter */}
            <select
              className="input flex-1"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            {/* Class Filter */}
            <select
              className="input flex-1"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              <option value="Nursery">Nursery</option>
              <option value="LKG">LKG</option>
              <option value="UKG">UKG</option>
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
            </select>

            {/* Status Filter */}
            <select
              className="input flex-1"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="converted">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No enquiries found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enquiries.map((enquiry) => (
                  <tr key={enquiry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-900">{enquiry.tokenId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{enquiry.childName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{enquiry.parentName}</div>
                      <div className="text-sm text-gray-500">{enquiry.mobile}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {enquiry.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[enquiry.status]}`}>
                        {statusLabels[enquiry.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {enquiry.slotBooked ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Booked
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          Not Booked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(enquiry.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/enquiries/${enquiry._id}`}
                        className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
