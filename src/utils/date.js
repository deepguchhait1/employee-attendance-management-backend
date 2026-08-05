export const getToday = () => {
  const date = new Date();

  return date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
};

export const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const difference = end - start;

  return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
};
