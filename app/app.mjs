import { setGlobalDevModeChecks } from 'reselect';

// import 'components/utils/configurePreact';
import ErrorBoundary from 'components/ErrorBoundary';
import { createRoot } from 'components/utils/react';
import store from 'components/utils/store';
// Import root app
import App from 'containers/App';

// disabled reselect v5 warnings: https://reselect.js.org/api/development-only-stability-checks/#2-per-selector-by-passing-an-identityfunctioncheck-option-directly-to-
setGlobalDevModeChecks({
  inputStabilityCheck: 'never',
  identityFunctionCheck: 'never',
});

store.injectedReducers = {}; // Reducer registry
store.injectedSagas = {}; // Saga registry

const MOUNT_NODE = document.getElementById('React_MainContainer');
let root;

const render = () => {
  root = createRoot(MOUNT_NODE);

  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
};

if (module.hot) {
  module.hot.accept(['containers/App'], () => {
    root.unmount();
    render();
  });
}

render();
