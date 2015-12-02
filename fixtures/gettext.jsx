module.exports = jest.genMockFunction().mockImplementation(function(text) {
  return text;
});
