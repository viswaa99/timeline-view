import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import moment from 'moment';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import holidayData from './holidays.json';
import { useVirtualizer } from '@tanstack/react-virtual';
import './layoutcheck.css';
import { v4 as uuid } from 'uuid';
import {
  makeData,
  FIELDS,
  utcToMs,
  ZOOM_LEVELS_CONVERSION,
  getDaysInMonth,
  getDaysInQuarter,
  getDaysInYear,
} from './util';
import TaskItem from './TaskItem';

const PER_DAY_SIZE_MONTH = 3.53;

const PER_DAY_SIZE_QUARTER = 0.94;

const PER_DAY_SIZE_YEAR = 0.294;

const DAY_BASED = ['MONTH', 'QUARTER', 'YEAR'];

const ZOOM_LEVELS = {
  HOUR: {
    width: 79,
    overlayWidth: 80,
    unit: 'Hours',
    step: 6,
    startDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .subtract(1, 'month'),
    endDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .add(1, 'month'),
    format: (date) => `${date.getHours()}:00`,
  },
  DAY: {
    width: 79,
    overlayWidth: 80,
    unit: 'Days',
    step: 1,
    startDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .subtract(1, 'month'),
    endDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .add(1, 'month'),
    format: (date) =>
      `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`,
  },
  WEEK: {
    width: 59,
    overlayWidth: 60,
    unit: 'Days',
    step: 1,
    startDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .subtract(2, 'month'),
    endDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .add(2, 'month'),
    format: (date) =>
      `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`,
  },
  MONTH: {
    width: 109,
    overlayWidth: 110,
    unit: 'Months',
    step: 1,
    startDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .subtract(3, 'year'),
    endDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .add(3, 'year'),
    format: (date) => date.toLocaleString('default', { month: 'long' }),
  },
  QUARTER: {
    width: 86,
    overlayWidth: 87,
    unit: 'Months',
    step: 3,
    startDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .subtract(3, 'year'),
    endDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .add(3, 'year'),
    format: (date) => `Q${Math.floor(date.getMonth() / 3) + 1}`,
  },
  YEAR: {
    width: 107,
    overlayWidth: 108,
    unit: 'FullYear',
    step: 1,
    startDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .subtract(5, 'year'),
    endDate: moment()
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .add(5, 'year'),
    format: (date) => date.getFullYear().toString(),
  },
};

const NON_HOLIDAY_MODES = ['MONTH', 'QUARTER', 'YEAR'];

export default function Timeline() {
  const [zoomLevel, setZoomLevel] = useState('DAY');
  const [dateBlocks, setDateBlocks] = useState([]);
  const tableContainerRef = useRef(null);
  const calendarRef = useRef(null);
  const topVal = zoomLevel !== 'YEAR' ? 80 : 60;

  const columnConfig = useMemo(function getColumnConfig() {
    return {
      listView: {
        accessorKey: 'listView',
        id: 'listView',
        header: <span></span>,
        cell: (info) => {
          return <div>{info.getValue()}</div>;
        },
      },
      calendarView: {
        accessorKey: 'calendarView',
        id: 'calendarView',
        header: <span></span>,
        cell: (info) => {
          return <div>{info.getValue()}</div>;
        },
      },
    };
  }, []);

  const handleChangeZoom = (level) => {
    setZoomLevel(level);
  };

  const data = useMemo(function setData() {
    return JSON.parse(makeData(500));
  }, []);

  const fieldLength = Object.keys(data[0]).length;

  const holidays = useMemo(function setHolidays() {
    return JSON.parse(JSON.stringify(holidayData)).map((item) => item.Date);
  }, []);

  const calendarColumns = useMemo(
    function constructCalendarColumns() {
      let columns = [];
      dateBlocks.forEach((dateBlock) => {
        columns.push({
          id: dateBlock.group || 'year',
          header: dateBlock.group,
          columns: dateBlock.dates.map((item) => {
            return {
              id: item.utcDate,
              header: item.formattedDate,
              // size: ZOOM_LEVELS[zoomLevel].width,
              cell: (props) => (
                <div
                  className='cellBox'
                  style={{
                    width: !DAY_BASED.includes(zoomLevel)
                      ? ZOOM_LEVELS[zoomLevel].width
                      : getCellWidth(item.utcDate),
                  }}
                ></div>
              ),
            };
          }),
        });
      });
      return columns;
    },
    [dateBlocks, zoomLevel]
  );

  function getCellWidth(utcDate) {
    switch (zoomLevel) {
      case 'MONTH':
        return getDaysInMonth(utcDate) * PER_DAY_SIZE_MONTH - 1;
      case 'QUARTER':
        console.log(getDaysInQuarter(utcDate), utcDate, 'cellWidthQuarter');
        return getDaysInQuarter(utcDate) * PER_DAY_SIZE_QUARTER - 1;
      case 'YEAR':
        console.log(
          getDaysInYear(utcDate) * PER_DAY_SIZE_YEAR,
          'cellWidthYear'
        );
        return getDaysInYear(utcDate) * PER_DAY_SIZE_YEAR - 1;
      default:
        return null;
    }
  }

  const listColumns = useMemo(
    function constructListColumns() {
      let columns = [];
      Object.keys(data[0]).forEach((item) => {
        columns.push({
          id: item,
          header: item,
          // minSize: 200,
          // size:300,
          enableResizing: true,
          accessorKey: item,
          cell: (props) => <div style={{ width: 200 }}>{props.getValue()}</div>,
        });
      });
      return columns;
    },
    [data]
  );

  const finalColumns = useMemo(
    function constructColumns() {
      let columns = [];
      columns = Object.values(columnConfig).map((item) => {
        if (item.id === 'listView') {
          item.columns = listColumns;
        } else {
          item.columns = calendarColumns;
        }
        return item;
      });
      return columns;
    },
    [calendarColumns, listColumns, columnConfig]
  );


  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
  });

    const rows = table.getRowModel().rows;

    const rowVirtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => tableContainerRef.current,
      estimateSize: () => 60, // rowHeight
      overscan: 15, // overscanCount
    });

    const totalHeight = rowVirtualizer.getTotalSize();
    const virtualRows = rowVirtualizer.getVirtualItems();

    const paddingTop =
      virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
    const paddingBottom =
      virtualRows.length > 0
        ? totalHeight - (virtualRows?.[virtualRows.length - 1]?.end || 0)
        : 0;

  // const { rows } = table.getRowModel();

  // const rowVirtualizer = useVirtualizer({
  //   count: rows.length,
  //   estimateSize: () => 62,
  //   getScrollElement: () => tableContainerRef.current,
  //   measureElement:
  //     typeof window !== 'undefined' &&
  //     navigator.userAgent.indexOf('Firefox') === -1
  //       ? (element) => element?.getBoundingClientRect().height
  //       : undefined,
  //   overscan:5,
  // });

  // console.log(rowVirtualizer.getVirtualItems(), 'VIRTUALS');

  const generateDates = useCallback(function ongenerateDates(
    mode,
    startDate,
    endDate
  ) {
    const dateBlocks = [];

    for (let i = startDate; i <= endDate; ) {
      const formattedDate = ZOOM_LEVELS[mode].format(new Date(i));
      // console.log(formattedDate, 'FR');
      const groupLabel = getGroupLabel(i, mode);
      if (
        !dateBlocks.length ||
        dateBlocks[dateBlocks.length - 1].group !== groupLabel
      ) {
        dateBlocks.push({
          group: groupLabel,
          dates: [
            {
              formattedDate,
              utcDate: moment(i)
                .add(1, 'days')
                .utc()
                .startOf('day')
                .format('YYYY-MM-DDTHH:mm:ss[Z]'),
            },
          ],
        });
      } else {
        dateBlocks[dateBlocks.length - 1].dates.push({
          formattedDate,
          utcDate: moment(i)
            .add(1, 'days')
            .utc()
            .startOf('day')
            .format('YYYY-MM-DDTHH:mm:ss[Z]'),
        });
      }
      // console.log(
      //   addTime(i, ZOOM_LEVELS[mode].unit, ZOOM_LEVELS[mode].step).format()
      // );
      i = new Date(
        addTime(i, ZOOM_LEVELS[mode].unit, ZOOM_LEVELS[mode].step).format()
      ).toISOString();
    }

    return dateBlocks;
  },
  []);

  useEffect(
    function onGenerateDates() {
      if (!ZOOM_LEVELS[zoomLevel].startDate || !ZOOM_LEVELS[zoomLevel].endDate)
        return;
      setDateBlocks(
        generateDates(
          zoomLevel,
          new Date(
            ZOOM_LEVELS[zoomLevel].startDate.format('MM/DD/YYYY')
          ).toISOString(),
          new Date(
            ZOOM_LEVELS[zoomLevel].endDate.format('MM/DD/YYYY')
          ).toISOString()
        )
      );
    },
    [zoomLevel, generateDates]
  );

  // console.log(
  //   dateVal.startDate?.format('MM/DD/YYYY'),
  //   dateVal.endDate?.format('MM/DD/YYYY'),
  //   'Dates$'
  // );

  // console.log(dateBlocks);

  function getStartDate() {
    switch (zoomLevel) {
      case 'HOUR':
      case 'DAY':
      case 'WEEK':
        return ZOOM_LEVELS[zoomLevel].startDate
          .utc()
          .startOf('day')
          .toISOString();
      case 'MONTH':
        return ZOOM_LEVELS[zoomLevel].startDate
          .utc()
          .startOf('month')
          .toISOString();
      case 'QUARTER':
        return ZOOM_LEVELS[zoomLevel].startDate
          .utc()
          .startOf('quarter')
          .toISOString();
      case 'YEAR':
        return ZOOM_LEVELS[zoomLevel].startDate
          .utc()
          .startOf('year')
          .toISOString();
      default:
        throw new Error('Invalid time unit for adding time');
    }
  }

  // console.log(moment(getStartDate()).valueOf(),moment().valueOf(),"SDTA")

  function convertTimeToDist(time) {
    console.log(time, 'GLL');
    return (
      (time * ZOOM_LEVELS_CONVERSION[zoomLevel].timeUnit) /
      ZOOM_LEVELS_CONVERSION[zoomLevel].Conv
    );
  }

  function addTime(date, mode, step) {
    const newDate = new Date(date);
    switch (mode) {
      case 'Hours':
        return moment(newDate).add(step, 'hours');
      case 'Days':
      case 'Week':
        return moment(newDate).add(step, 'days');
      case 'Months':
        return moment(newDate).add(step, 'months');
      case 'FullYear':
        return moment(newDate).add(step, 'years');
      default:
        throw new Error('Invalid time unit for adding time');
    }
  }

  function getGroupLabel(date, mode) {
    switch (mode) {
      case 'HOUR':
        return moment(date).format('D MMM');
      case 'DAY':
        return moment(date).format('MMM YYYY');
      case 'WEEK':
        return moment(date).startOf('week').format('MMM DD YYYY');
      case 'MONTH':
      case 'QUARTER':
        return moment(date).format('YYYY');
      case 'YEAR':
        return '';
      default:
        return '';
    }
  }

  console.log(
    {
      header: table.getHeaderGroups(),
      rows: table.getRowModel(),
    },
    'ApiData'
  );

  // console.log({listColumns,calendarColumns,finalColumns},"COLSS")

  const width = useMemo(function getWidth(){
    return (
      rows[0].getVisibleCells().slice(fieldLength).length *
      ZOOM_LEVELS[zoomLevel].overlayWidth
    );
  },[fieldLength,zoomLevel,rows])

  console.log(
    table.getRowModel().rows[0].getVisibleCells().slice(fieldLength).length *
      ZOOM_LEVELS[zoomLevel].overlayWidth,
    'LEN'
  );

function renderFakeOverlay(){
return (
  <div
    style={{
      display: 'grid',
      position: 'absolute',
      top: `${topVal}px`,
      height: `${rowVirtualizer.getTotalSize()}px`,
      width: `${
        rows[0].getVisibleCells().slice(fieldLength).length *
        ZOOM_LEVELS[zoomLevel].overlayWidth
      }px`,
    }}
  >
    {paddingTop > 0 && (
      <tr>
        <td style={{ height: `${paddingTop}px` }} />
      </tr>
    )}
    {virtualRows.map((virtualRow, index) => {
      const row = rows[virtualRow.index];
      console.log(row, 'ROZ');
      return (
        <div
          data-index={virtualRow.index}
          key={`${row.id} ${uuid()}`}
          style={{
            display: 'grid',
            // gridAutoFlow: 'column',
            position: 'relative',
            height: '60px',
          }}
        >
          <TaskItem
            data={row.original}
            index={row.index}
            zoomValue={zoomLevel}
            startDate={() => getStartDate()}
            calendarRef={calendarRef}
            marginTop={row.index * 60}
          />
        </div>
      );
    })}
    {paddingBottom > 0 && (
      <tr>
        <td style={{ height: `${paddingBottom}px` }} />
      </tr>
    )}
  </div>
);
  }

  return (
    <>
      <div className='zoom-controls'>
        {Object.keys(ZOOM_LEVELS).map((level) => (
          <button key={level} onClick={() => handleChangeZoom(level)}>
            {level}
          </button>
        ))}
      </div>
      <div className='table-container'>
        <div className='table-wrapper' ref={tableContainerRef}>
          <div
            className='table-data-wrapper'
            style={{ height: `${data.length * 60 + 80}px` }}
          >
            <table>
              <thead className='sticky-header' style={{ height: '80px' }}>
                {table.getHeaderGroups().map((headerGroup, index) => {
                  if (headerGroup.depth === 0) return null;

                  return (
                    <tr key={`${headerGroup.id} ${index} ${uuid()}`}>
                      {headerGroup.headers.map((header, index) => {
                        if (index >= fieldLength || header.isPlaceholder)
                          return null;
                        return (
                          <th key={`${header.id} ${index} ${uuid()}`}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
              </thead>
              <tbody style={{ height: `${data.length * 60}px` }}>
                {table.getRowModel().rows.map((row, index) => {
                  return (
                    <tr key={`${row.id} ${index} ${uuid()}`}>
                      {row.getVisibleCells().map((cell, index) => {
                        if (index >= fieldLength) return null;
                        return (
                          <td
                            key={`${cell.id} ${index} ${uuid()}`}
                            style={{
                              width: `${cell.column.getSize()}px`,
                              minWidth: `${cell.column.columnDef.minSize}`,
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                            {/* {cell.row.original[cell.column.id]?.toString()} */}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div
            className='table-data-wrapper'
            ref={calendarRef}
            style={{
              height: `${data.length * 60 + 80}px`,
              position: 'relative',
            }}
          >
            {renderFakeOverlay()}
            <table>
              <thead className='sticky-header'>
                {table.getHeaderGroups().map((headerGroup, index) => (
                  <tr key={`${headerGroup.id} ${index} ${uuid()}`}>
                    {headerGroup.headers.map((header, index) => {
                      if (index < fieldLength) return null;
                      return (
                        <th
                          key={`${header.id} ${index} ${uuid()}`}
                          colSpan={header.colSpan}
                          // style={{
                          //   width: `${header.column.getSize()}px`,
                          // }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody
                style={{
                  // display: 'grid',
                  // height: `${rowVirtualizer.getTotalSize()}px`,
                  position: 'relative',
                }}
              >
                {/* <div
                  id='current-time'
                  style={{
                    left: `${convertTimeToDist(
                      moment().valueOf() - moment(getStartDate()).valueOf()
                    )}px`,
                    width: '1px',
                    position: 'absolute',
                    zIndex: 12,
                    height: '100%',
                  }}
                /> */}
                {/* {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                  </tr>
                )} */}
                {virtualRows.map((virtualRow, index) => {
                  const row = rows[virtualRow.index];
                  console.log(row, 'ROZ');
                  return (
                    <>
                      {/* <TaskItem
                        data={row.original}
                        index={row.index}
                        zoomValue={zoomLevel}
                        startDate={() => getStartDate()}
                        calendarRef={calendarRef}
                      /> */}
                      <tr
                        key={`${row.id} ${uuid()}`}
                        // style={{ position: 'relative' }}
                      >
                        {row.getVisibleCells().map((cell, index) => {
                          if (index < fieldLength) return null;
                          console.log(index, 'Idx');
                          const columnId = cell.column.id;
                          const isHoliday =
                            holidays.includes(columnId) &&
                            !NON_HOLIDAY_MODES.includes(zoomLevel);
                          return (
                            <td
                              key={`${cell.id} ${index} ${uuid()}`}
                              style={{
                                backgroundColor: isHoliday
                                  ? 'lightgray'
                                  : 'none',
                                height: '60px',
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </>
                  );
                })}
                {/* {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )} */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
