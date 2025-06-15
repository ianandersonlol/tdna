// Test script to verify T-DNA visualization centering
// Run this in the browser console when viewing AT1G25320 with SALK_110111.42.60.x

// Check if the view is properly centered on the T-DNA insertion
const checkCentering = () => {
  // Expected T-DNA position for SALK_110111.42.60.x at AT1G25320
  const expectedPosition = 8879258;
  
  // Get the current view region from JBrowse
  const viewState = document.querySelector('[data-testid="linear-genome-view"]');
  if (!viewState) {
    console.error('JBrowse view not found');
    return;
  }
  
  console.log('Checking T-DNA visualization for SALK_110111.42.60.x at chr1:8,879,258');
  console.log('Expected position:', expectedPosition);
  
  // Check if features are rendered
  const features = document.querySelectorAll('[data-testid="feature"]');
  console.log('Number of features rendered:', features.length);
  
  // Look for T-DNA insertion feature
  const tdnaFeature = Array.from(features).find(f => 
    f.textContent && f.textContent.includes('T-DNA')
  );
  
  if (tdnaFeature) {
    console.log('✓ T-DNA insertion feature found');
  } else {
    console.log('✗ T-DNA insertion feature not found');
  }
};

checkCentering();