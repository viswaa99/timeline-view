import { useState, useEffect, useRef } from 'react';
import './taskitem.css';
import moment from 'moment';
import momenttz from 'moment-timezone';

import { ZOOM_LEVELS_CONVERSION } from './util';

const initialTasks = [
  { id: 1, name: 'Task 1', start: '2024-07-24', end: '2024-07-25' },
  {
    id: 2,
    name: 'Task 2',
    start: '2024-07-30',
    end: '2024-08-01',
  },
  { id: 3, name: 'Task 3', start: '2024-07-24', end: '2024-08-02' },
];

const THRESHOLD = 50;

const hrConv = 60 * 60 * 1000;
const dayConv = 24 * 60 * 60 * 1000;
const timeUnit = 100;

const DAY_BASED = ['MONTH', 'QUARTER', 'YEAR'];

const PER_DAY_SIZE = {
  MONTH: 3.53,
  QUARTER: 0.94,
  YEAR: 0.294,
};

export default function TaskItem({
  data,
  index,
  startDate,
  zoomValue,
  calendarRef,
  marginTop
}) {
  console.log(data, 'TaskData');
  const taskRef = useRef({});
  const [task, setTask] = useState(data);
  const [zoom, setZoom] = useState(
    ZOOM_LEVELS_CONVERSION[zoomValue].id || 'Day'
  );

  // console.log(
  //   calendarRef.current?.scrollLeft,
  //   calendarRef.current?.clientWidth,
  //   taskRef.current.offsetWidth,
  //   parseFloat(
  //     taskRef.current.style?.transform?.match(/translateX\(([-\d.]+)px\)/)[1]
  //   ),
  //   'calendarRef'
  // );
  // console.log(ZOOM_LEVELS_CONVERSION[zoomValue],"ZMM");
  // const [startDate, setSt] = useState('2024-06-20');
  const [endDate, setEt] = useState('2024-06-09');
  const currentTaskRef = useRef();
  const currentDate = new Date();
  // const startDate = new Date("2024-05-28");
  // const endDate = new Date("2024-06-09");
  // console.log(startDate.toString(), endDate.toString(), 'GL');

  useEffect(
    function initDat() {
      setZoom(ZOOM_LEVELS_CONVERSION[zoomValue].id);
    },
    [zoomValue]
  );

  function convertTimeToDist(time) {
    console.log(time, 'GLL');
    return (
      (time * ZOOM_LEVELS_CONVERSION[zoomValue].timeUnit) /
      ZOOM_LEVELS_CONVERSION[zoomValue].Conv
    );
  }
  function convertDistToTime(dist) {
    return (
      (dist * ZOOM_LEVELS_CONVERSION[zoomValue].Conv) /
      ZOOM_LEVELS_CONVERSION[zoomValue].timeUnit
    );
  }

  const handleChange = (event) => {
    setZoom(event.target.value);
  };

  console.log('DBG', zoom);

  // function computeStartEnd() {
  //   const currentDate = new Date();
  //   setSt(new Date(currentDate.getTime() - ZOOM_LEVELS_CONVERSION[zoom].widthUnit));
  //   setEt(new Date(currentDate.getTime() + ZOOM_LEVELS_CONVERSION[zoom].widthUnit));
  // }

  // useEffect(
  //   function initDat() {
  //     computeStartEnd();
  //   },
  //   [zoom]
  // );

  function handleMouseDown(e, task, direction) {
    const [timestampStart] = task._start_date.split(' ');
    const [timestampEnd] = task.DueDate.split(' ');
    const width = convertTimeToDist(
      moment(timestampEnd).utc().valueOf() -
        moment(timestampStart).utc().valueOf()
    );
    e.preventDefault();
    e.stopPropagation();
    const element = e.target.parentElement;
    const startWidth = e.target.parentElement.offsetWidth;
    const taskStartDate = new Date(task.start);
    const taskEndDate = new Date(task.end);
    const threshold = 50;
    const startX = e.clientX;
    const startLeft = convertTimeToDist(taskStartDate - startDate());
    currentTaskRef.current = task;
    const onMouseMove = (moveEvent) => {
      console.log(moveEvent.offsetX, 'MV');
      //scrolllogic
      taskRef.current.style.position = 'absolute';
      const scrollable = calendarRef.current;
      const scrollLeft = scrollable.scrollLeft;
      const scrollRight = scrollLeft + scrollable.clientWidth;
      const elementLeft = parseFloat(
        taskRef.current.style?.transform?.match(/translateX\(([-\d.]+)px\)/)[1]
      );
      const elementWidth = taskRef.current.offsetWidth;
      console.log(elementWidth, elementLeft, scrollLeft, scrollRight, 'ELW');
      console.log(scrollRight - (elementWidth + elementLeft), 'ELW');

      if (elementLeft - scrollLeft < 50) {
        scrollable.scrollTo({
          left: scrollLeft - 150,
          behavior: 'smooth',
        });
      }
      if (scrollRight - (elementWidth + elementLeft) < 50) {
        scrollable.scrollTo({
          left: scrollLeft + 150,
          behavior: 'smooth',
        });
      }
      //scrolllogic
      if (elementWidth > threshold) {
        task.hideChild = false;
      } else {
        task.hideChild = true;
      }
      if (direction === 'right') {
        // const newWidth = startWidth + (moveEvent.clientX - startX);
        const diff = moveEvent.clientX - startX;
        const endTime =
          moment(timestampEnd).utc().valueOf() + convertDistToTime(diff);
        task.DueDate = new Date(endTime).toISOString();
      } else if (direction === 'left') {
        // const newWidth = startWidth + (startX - moveEvent.clientX);
        const diff = moveEvent.clientX - startX;
        const startTime =
          moment(timestampStart).utc().valueOf() + convertDistToTime(diff);
        task._start_date = new Date(startTime).toISOString();
      }
      currentTaskRef.current = task;
      setTask({ ...task });
    };

    const onMouseUp = () => {
      // const startDate = new Date(currentTaskRef.current._start_date);
      // const endDate = new Date(currentTaskRef.current.DueDate);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      taskRef.current.style.position = 'inset';
      console.log(
        {
          start: currentTaskRef.current._start_date,
          end: currentTaskRef.current.DueDate,
        },
        'Datte'
      );
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  console.log(task, 'taskData');

  const handleDragStart = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    const [timestampStart] = task._start_date.split(' ');
    const [timestampEnd] = task.DueDate.split(' ');
    const startX = e.clientX;
    const startLeft = e.target.offsetLeft;
    const taskStartDate = new Date(task.start);
    const taskEndDate = new Date(task.end);
    currentTaskRef.current = task;
    const onMouseMove = (moveEvent) => {
      const scrollable = calendarRef.current;
      const scrollLeft = scrollable.scrollLeft;
      const scrollRight = scrollLeft + scrollable.clientWidth;
      const elementLeft = parseFloat(
        taskRef.current.style?.transform?.match(/translateX\(([-\d.]+)px\)/)[1]
      );
      const elementWidth = taskRef.current.offsetWidth;
      console.log(elementWidth, elementLeft, scrollLeft, scrollRight, 'ELW');
      console.log(scrollRight - (elementWidth + elementLeft), 'ELW');

      if (elementLeft - scrollLeft < 50) {
        scrollable.scrollTo({
          left: scrollLeft - 150,
          behavior: 'smooth',
        });
      }
      if (scrollRight - (elementWidth + elementLeft) < 50) {
        scrollable.scrollTo({
          left: scrollLeft + 150,
          behavior: 'smooth',
        });
      }
      const diff = moveEvent.clientX - startX;
      const startTime =
        moment(timestampStart).utc().valueOf() + convertDistToTime(diff);
      task._start_date = new Date(startTime).toISOString();
      const endTime =
        moment(timestampEnd).utc().valueOf() + convertDistToTime(diff);
      task.DueDate = new Date(endTime).toISOString();
      currentTaskRef.current = task;
      setTask({ ...task });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      console.log(
        {
          start: currentTaskRef.current._start_date,
          end: currentTaskRef.current.DueDate,
        },
        'Datte'
      );
    };

    document.addEventListener('mousemove', onMouseMove);

    document.addEventListener('mouseup', onMouseUp);
  };

  function renderTasks() {
    const dayBased = DAY_BASED.includes(zoomValue);
    console.log('calling');
    const [timestampStart] = task._start_date.split(' ');
    const [timestampEnd] = task.DueDate.split(' ');
    console.log(timestampStart, timestampEnd, 'SE');
    const dayDiff = moment(timestampStart)
      .utc()
      .diff(moment(startDate()).utc(), 'days');
    const timeDiff = !dayBased
      ? convertTimeToDist(
          moment(timestampStart).utc().valueOf() -
            moment(startDate()).utc().valueOf()
        )
      : moment(timestampStart).utc().diff(moment(startDate()).utc(), 'days') *
        PER_DAY_SIZE[zoomValue];
    // console.log(moment(timestampStart).utc().startOf('year'),"yearmilli");
    console.log(dayDiff, 'DayDiff');
    console.log(
      moment(timestampStart).utc().valueOf() -
        moment(startDate()).utc().startOf('month').valueOf(),
      'millivals'
    );
    const width = convertTimeToDist(
      moment(timestampEnd).utc().valueOf() -
        moment(timestampStart).utc().valueOf()
    );
    console.log(convertTimeToDist(timeDiff), timeDiff, 'DIFFF');
    console.log(timeDiff, width, 'Good');
    return (
      <div
        className='task'
        key={task._id}
        ref={taskRef}
        style={{
          transform: `translateX(${timeDiff}px)`,
          width: `${width}px`,
        }}
        onMouseDown={(e) => handleDragStart(e, task)}
      >
        {!task.hideChild ? `${task._id}` : ''}
        <div
          className='gantt-task-resize-left'
          onMouseDown={(e) => handleMouseDown(e, task, 'left')}
        />
        <div
          className='gantt-task-resize-right'
          onMouseDown={(e) => handleMouseDown(e, task, 'right')}
        />
      </div>
    );
  }

  return (
    <>
      {/* <div
        className='current-marker'
        id='current-time'
        style={{ left: `${convertTimeToDist(currentDate - new Date(startDate))}px` , zIndex:12 , height:'100vh' }}
      /> */}
      {renderTasks()}
    </>
  );
}
