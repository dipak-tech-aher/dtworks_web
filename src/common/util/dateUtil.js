import moment from "moment";

export const formatDate = (dateStr, defaultVal) => {
  if (dateStr) {
    if (typeof dateStr === "string") {
      if (dateStr.indexOf("T00:00:00.000Z") > -1) {
        dateStr = dateStr.replace("T00:00:00.000Z", "T00:00:00.000");
      } else if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.exec(dateStr)) {
        dateStr = dateStr.concat("T00:00:00.000");
      }
    }
    const date = new Date(dateStr);
    var mnthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var day = date.getDate();
    var month = mnthArray[date.getMonth()];
    var year = date.getFullYear();
    // return "" + (day <= 9 ? "0" + day : day) + " " + month + ", " + year;
    return month + " " + (day <= 9 ? "0" + day : day) + ", " + year;
  } else {
    return defaultVal;
  }
};

export const formatDateDDMMMYY = (dateStr) => {
  let mnthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const date = new Date(dateStr.slice(0, 9))

  return (
    date.getDate().toString().padStart(2, 0) +
    " " +
    mnthArray[date.getMonth()] +
    " " +
    date.getFullYear()
  );
};

export const formatISODateDDMMMYY = (dateStr) => {
  let mnthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const date = new Date(dateStr)

  return (
    date.getDate().toString().padStart(2, 0) +
    " " +
    mnthArray[date.getMonth()] +
    " " +
    date.getFullYear()
  );
};
export const formatISODDMMMYY = (dateStr) => {
  //let mnthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const date = new Date(dateStr)

  return (
    date.getDate().toString().padStart(2, 0) +
    "-" +
    (date.getMonth() + 1).toString().padStart(2, 0) +
    "-" +
    date.getFullYear()
  );
};
export const formatISODateTime = (dateStr) => {
  let mnthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const date = new Date(dateStr)

  return (
    date.getDate().toString().padStart(2, 0) +
    " " +
    mnthArray[date.getMonth()] +
    " " +
    date.getFullYear() +
    " " +
    ((date.getHours() === 0) ? 12 : ((date.getHours() > 12) ? ((date.getHours() - 12) < 10 ? "0" + date.getHours() - 12 : (date.getHours() - 12)) : ((date.getHours()) < 10 ? "0" + date.getHours() : date.getHours()))) +
    ":" +
    (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) +
    ":" +
    (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds()) +
    " " +
    ((date.getHours() >= 12) ? 'PM' : 'AM')
  );
};

export const formatDateMMDDYYYY = (date) => {
  return (
    date.getFullYear().toString() +
    "-" +
    (date.getMonth() + 1).toString().padStart(2, 0) +
    "-" +
    date.getDate().toString().padStart(2, 0)
  );
};

export const formatDateForBirthDate = (dateStr) => {
  if (typeof dateStr === "string") {
    if (dateStr.indexOf("T00:00:00.000Z") > -1) {
      dateStr = dateStr.replace("T00:00:00.000Z", "T00:00:00.000");
    } else if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.exec(dateStr)) {
      dateStr = dateStr.concat("T00:00:00.000");
    }
  }
  const date = new Date(dateStr);
  return (
    date.getFullYear().toString() +
    "-" +
    (date.getMonth() + 1).toString().padStart(2, 0) +
    "-" +
    date.getDate().toString().padStart(2, 0)
  );
};

export const DefaultDateFormate = (date, formate = 'DD-MM-YYYY') => {
  let response = ''
  if (date) {
    response = date ? moment(date).format(formate) : ''
  }
  return response
}


export const daysLookUp = [
  { label: 0, value: 0 },
  { label: 1, value: 1 },
  { label: 2, value: 2 },
  { label: 3, value: 3 },
  { label: 4, value: 4 },
  { label: 5, value: 5 },
  { label: 6, value: 6 },
  { label: 7, value: 7 },
  { label: 8, value: 8 },
  { label: 9, value: 9 },
  { label: 10, value: 10 },
  { label: 11, value: 11 },
  { label: 12, value: 12 },
  { label: 13, value: 13 },
  { label: 14, value: 14 },
  { label: 15, value: 15 },
  { label: 16, value: 16 },
  { label: 17, value: 17 },
  { label: 18, value: 18 },
  { label: 19, value: 19 },
  { label: 20, value: 20 },
  { label: 21, value: 21 },
  { label: 22, value: 22 },
  { label: 23, value: 23 },
  { label: 24, value: 24 },
  { label: 25, value: 25 },
  { label: 26, value: 26 },
  { label: 27, value: 27 },
  { label: 28, value: 28 },
  { label: 29, value: 29 },
  { label: 30, value: 30 },
  { label: 31, value: 31 }
]

export const hoursLookUp = [
  { label: 0, value: 0 },
  { label: 1, value: 1 },
  { label: 2, value: 2 },
  { label: 3, value: 3 },
  { label: 4, value: 4 },
  { label: 5, value: 5 },
  { label: 6, value: 6 },
  { label: 7, value: 7 },
  { label: 8, value: 8 },
  { label: 9, value: 9 },
  { label: 10, value: 10 },
  { label: 11, value: 11 }
]

export const minuteLookUp = [
  { label: 0, value: 0 },
  { label: 1, value: 1 },
  { label: 2, value: 2 },
  { label: 3, value: 3 },
  { label: 4, value: 4 },
  { label: 5, value: 5 },
  { label: 6, value: 6 },
  { label: 7, value: 7 },
  { label: 8, value: 8 },
  { label: 9, value: 9 },
  { label: 10, value: 10 },
  { label: 11, value: 11 },
  { label: 12, value: 12 },
  { label: 13, value: 13 },
  { label: 14, value: 14 },
  { label: 15, value: 15 },
  { label: 16, value: 16 },
  { label: 17, value: 17 },
  { label: 18, value: 18 },
  { label: 19, value: 19 },
  { label: 20, value: 20 },
  { label: 21, value: 21 },
  { label: 22, value: 22 },
  { label: 23, value: 23 },
  { label: 24, value: 24 },
  { label: 25, value: 25 },
  { label: 26, value: 26 },
  { label: 27, value: 27 },
  { label: 28, value: 28 },
  { label: 29, value: 29 },
  { label: 30, value: 30 },
  { label: 31, value: 31 },
  { label: 32, value: 32 },
  { label: 33, value: 33 },
  { label: 34, value: 34 },
  { label: 35, value: 35 },
  { label: 36, value: 36 },
  { label: 37, value: 37 },
  { label: 38, value: 38 },
  { label: 39, value: 39 },
  { label: 40, value: 40 },
  { label: 41, value: 41 },
  { label: 42, value: 42 },
  { label: 43, value: 43 },
  { label: 44, value: 44 },
  { label: 45, value: 45 },
  { label: 46, value: 46 },
  { label: 47, value: 47 },
  { label: 48, value: 48 },
  { label: 49, value: 49 },
  { label: 50, value: 50 },
  { label: 51, value: 51 },
  { label: 52, value: 52 },
  { label: 53, value: 53 },
  { label: 54, value: 54 },
  { label: 55, value: 55 },
  { label: 56, value: 56 },
  { label: 57, value: 57 },
  { label: 58, value: 58 },
  { label: 59, value: 59 }
]

export function getUTCLocalDateAndTime(inputDate) {
  const year = inputDate.getUTCFullYear();
  const month = inputDate.getUTCMonth() + 1;
  const day = inputDate.getUTCDate();

  // Extract time components
  const hours = inputDate.getUTCHours();
  const minutes = inputDate.getUTCMinutes();
  const seconds = inputDate.getUTCSeconds();

  // Format date and time as strings
  //date in YYYY-MM-DD and time in HH:mm:ss format
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {date, time}
}