'use client'

import { useEffect, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfDay, endOfDay, startOfISOWeek, endOfISOWeek } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Calendar as CalendarIcon, Clock, MapPin, User } from 'lucide-react'

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

interface Booking {
    _id: string
    tokenId: string
    admissionId: {
        studentName: string
        parentName: string
    }
}

interface Slot {
    _id: string
    date: string
    startTime: string
    endTime: string
    capacity: number
    bookedCount: number
    status: string
    bookings?: Booking[]
}

type FilterType = 'today' | 'week' | 'all'

export default function PrincipalCalendarPage() {
    const [slots, setSlots] = useState<Slot[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('all')
    const [selectedEvent, setSelectedEvent] = useState<any>(null)

    useEffect(() => {
        fetchSlots()
    }, [])

    const fetchSlots = async () => {
        setLoading(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/slots`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    }
                }
            )
            const data = await response.json()

            if (data.success && data.data) {
                // Filter only slots with bookings
                const bookedSlots = data.data.filter((slot: Slot) =>
                    slot.bookedCount > 0 && slot.bookings && slot.bookings.length > 0
                )
                setSlots(bookedSlots)
            }
        } catch (error) {
            console.error('Error fetching slots:', error)
        } finally {
            setLoading(false)
        }
    }

    // Convert slots to calendar events
    const events = slots.flatMap((slot) => {
        if (!slot.bookings || slot.bookings.length === 0) return []

        return slot.bookings.map((booking) => {
            const start = new Date(`${slot.date}T${slot.startTime}`)
            const end = new Date(`${slot.date}T${slot.endTime}`)

            return {
                title: booking.admissionId?.studentName || 'Unknown Student',
                start,
                end,
                resource: {
                    slot,
                    booking,
                    studentName: booking.admissionId?.studentName || 'Unknown',
                    tokenId: booking.tokenId,
                    time: `${slot.startTime} - ${slot.endTime}`,
                    location: 'Counselling Room' // Default location
                }
            }
        })
    })

    // Apply filter
    const filteredEvents = events.filter((event) => {
        const now = new Date()
        const eventDate = event.start

        switch (filter) {
            case 'today':
                return eventDate >= startOfDay(now) && eventDate <= endOfDay(now)
            case 'week':
                return eventDate >= startOfISOWeek(now) && eventDate <= endOfISOWeek(now)
            case 'all':
            default:
                return true
        }
    })

    const eventPropGetter = () => {
        return {
            className: 'bg-blue-100 text-blue-800 border-blue-200 border rounded-md text-xs font-medium',
            style: {
                backgroundColor: undefined,
            }
        }
    }

    const EventComponent = ({ event }: any) => {
        return (
            <div className="h-full w-full flex flex-col justify-center pointer-events-none px-1">
                <div className="font-semibold truncate">{event.title}</div>
                <div className="text-xs opacity-75 truncate">{event.resource.tokenId}</div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Counselling Calendar</h2>
                    <p className="text-gray-600">View all scheduled counselling sessions</p>
                </div>

                {/* Filter Buttons */}
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setFilter('today')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'today'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setFilter('week')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'week'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        This Week
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'all'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        All
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card">
                    <div className="flex items-center">
                        <div className="bg-blue-500 p-3 rounded-lg">
                            <CalendarIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Sessions</p>
                            <p className="text-2xl font-bold text-gray-900">{filteredEvents.length}</p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center">
                        <div className="bg-green-500 p-3 rounded-lg">
                            <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Slots</p>
                            <p className="text-2xl font-bold text-gray-900">{slots.length}</p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center">
                        <div className="bg-purple-500 p-3 rounded-lg">
                            <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Today</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {events.filter(e => {
                                    const now = new Date()
                                    return e.start >= startOfDay(now) && e.start <= endOfDay(now)
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            {filteredEvents.length === 0 ? (
                <div className="card text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No scheduled counselling sessions found</p>
                </div>
            ) : (
                <div className="h-[600px] bg-white p-4 rounded-lg border shadow-sm">
                    <Calendar
                        localizer={localizer}
                        events={filteredEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        views={['month', 'week', 'day']}
                        defaultView="month"
                        onSelectEvent={(event) => setSelectedEvent(event)}
                        eventPropGetter={eventPropGetter}
                        components={{
                            event: EventComponent
                        }}
                    />
                </div>
            )}

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Session Details</h3>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Student Name</p>
                                    <p className="font-medium text-gray-900">{selectedEvent.resource.studentName}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Time</p>
                                    <p className="font-medium text-gray-900">
                                        {format(selectedEvent.start, 'MMMM d, yyyy')} at {selectedEvent.resource.time}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Token ID</p>
                                    <p className="font-medium text-gray-900 font-mono">{selectedEvent.resource.tokenId}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Location</p>
                                    <p className="font-medium text-gray-900">{selectedEvent.resource.location}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="btn-secondary w-full"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
