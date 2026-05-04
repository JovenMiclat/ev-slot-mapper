export const formatUpdatedAt = (updatedAt: string) => {
  const timestamp = Date.parse(updatedAt);

  if (Number.isNaN(timestamp)) {
    return updatedAt;
  }

  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
};

export const formatPeso = (amount: number) => `PHP ${amount.toFixed(0)}/kWh`;
