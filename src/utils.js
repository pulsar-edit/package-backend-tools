
module.exports = {
  isLengthyString: (str) => {
    return (typeof str === "string" && str.length > 0);
  },
  isYesInput: (str) => {
    return (str.toLowerCase() === "y" || str.toLowerCase() === "yes");
  }
};
