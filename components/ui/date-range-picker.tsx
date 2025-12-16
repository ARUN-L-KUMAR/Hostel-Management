"use client"

import * as React from "react"
import dayjs, { Dayjs } from "dayjs"
import { LocalizationProvider } from "@mui/x-date-pickers-pro/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers-pro/AdapterDayjs"
import { DateRangePicker as MuiDateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker"
import { SingleInputDateRangeField } from "@mui/x-date-pickers-pro/SingleInputDateRangeField"
import { DateRange } from "@mui/x-date-pickers-pro/models"
import { LicenseInfo } from '@mui/x-license';
LicenseInfo.setLicenseKey('e0d9bb8070ce0054c9d9ecb6e82cb58fTz0wLEU9MzI0NzIxNDQwMDAwMDAsUz1wcmVtaXVtLExNPXBlcnBldHVhbCxLVj0y');


interface DateRangePickerProps {
    startDate: string
    endDate: string
    onStartDateChange: (date: string) => void
    onEndDateChange: (date: string) => void
    className?: string
}

export function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    className,
}: DateRangePickerProps) {
    const value: DateRange<Dayjs> = [
        startDate ? dayjs(startDate) : null,
        endDate ? dayjs(endDate) : null,
    ]

    const handleChange = (newValue: DateRange<Dayjs>) => {
        if (newValue[0]) {
            onStartDateChange(newValue[0].format("YYYY-MM-DD"))
        }
        if (newValue[1]) {
            onEndDateChange(newValue[1].format("YYYY-MM-DD"))
        } else if (newValue[0] && !newValue[1]) {
            // If only start date selected, keep end date as is or set same as start
            onEndDateChange(newValue[0].format("YYYY-MM-DD"))
        }
    }

    return (
        <div className={className}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MuiDateRangePicker
                    value={value}
                    onChange={handleChange}
                    slots={{ field: SingleInputDateRangeField }}
                    slotProps={{
                        textField: {
                            size: "small",
                            sx: {
                                minWidth: 280,
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: "white",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    "& fieldset": {
                                        borderColor: "#e2e8f0",
                                    },
                                    "&:hover fieldset": {
                                        borderColor: "#cbd5e1",
                                    },
                                    "&.Mui-focused fieldset": {
                                        borderColor: "#3b82f6",
                                        borderWidth: "1px",
                                    },
                                },
                                "& .MuiInputBase-input": {
                                    padding: "8px 12px",
                                },
                            },
                        },
                        shortcuts: {
                            items: [
                                {
                                    label: "Today",
                                    getValue: () => {
                                        const today = dayjs()
                                        return [today, today]
                                    },
                                },
                                {
                                    label: "Last 7 Days",
                                    getValue: () => {
                                        const today = dayjs()
                                        return [today.subtract(7, "day"), today]
                                    },
                                },
                                {
                                    label: "This Month",
                                    getValue: () => {
                                        const today = dayjs()
                                        return [today.startOf("month"), today]
                                    },
                                },
                                {
                                    label: "Last Month",
                                    getValue: () => {
                                        const today = dayjs()
                                        const lastMonth = today.subtract(1, "month")
                                        return [lastMonth.startOf("month"), lastMonth.endOf("month")]
                                    },
                                },
                                {
                                    label: "Last 3 Months",
                                    getValue: () => {
                                        const today = dayjs()
                                        return [today.subtract(3, "month"), today]
                                    },
                                },
                            ],
                        },
                    }}
                    calendars={2}
                    localeText={{ start: "From", end: "To" }}
                />
            </LocalizationProvider>
        </div>
    )
}
