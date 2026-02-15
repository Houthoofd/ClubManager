// jest.teardown.cjs
// Global teardown to close connections and prevent Jest open handles warnings

module.exports = async () => {
  console.log('Jest teardown - Cleaning up test environment...');

  // Allow time for connections to close gracefully
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('Jest teardown completed');
};
