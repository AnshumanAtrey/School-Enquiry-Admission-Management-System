'use client'

import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Slot } from './page'

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

interface CalendarViewProps {
    slots: Slot[]
    onSlotClick: (slot: Slot) => void
}

export default function CalendarView({ slots, onSlotClick }: CalendarViewProps) {
    // Map slots to events
    const events = slots.map((slot) => {
        const start = new Date(`${slot.date}T${slot.startTime}`)
        const end = new Date(`${slot.date}T${slot.endTime}`)

        // Determine title based on booking
        const title = `${slot.bookedCount}/${slot.capacity}`

        return {
            title,
            start,
            end,
            resource: slot,
        }
    })

    const eventPropGetter = (event: any) => {
        const slot = event.resource as Slot
        let className = ''

        if (slot.status === 'full' || slot.bookedCount >= slot.capacity) {
            className = 'bg-red-100 text-red-800 border-red-200'
        } else if (slot.bookedCount > 0) { // Partially booked
            className = 'bg-blue-100 text-blue-800 border-blue-200'
        } else { // Available
            className = 'bg-green-100 text-green-800 border-green-200'
        }

        if (slot.status === 'disabled') {
            className = 'bg-gray-100 text-gray-800 border-gray-200 opacity-70'
        }

        return {
            className: `border rounded-md text-xs font-medium ${className}`,
            style: {
                backgroundColor: undefined, // Let tailwind handle it
            }
        }
    }

    // Custom Event Component
    const EventComponent = ({ event }: any) => {
        return (
            <div className="h-full w-full flex items-center justify-center pointer-events-none">
                {event.title}
            </div>
        )
    }

    return (
        <div className="h-[600px] bg-white p-4 rounded-lg border shadow-sm">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                defaultView="month"
                onSelectEvent={(event) => onSlotClick(event.resource)}
                eventPropGetter={eventPropGetter}
                components={{
                    event: EventComponent
                }}
            />

            {/* Legend */}
            <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-2"></div>
                    <span>Partially Booked</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-100 border border-red-200 rounded mr-2"></div>
                    <span>Full</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                    <span>Disabled</span>
                </div>
            </div>
        </div>
    )
}
