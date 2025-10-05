import { ErrorInfo, PureComponent, ReactNode } from 'components/utils/react';

import AppError from './AppError';
import { reportCatchError } from './utils';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends PureComponent<Props, State> {
  // eslint-disable-next-line react/state-in-constructor
  state = { hasError: false };

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportCatchError(error, info);
    this.setState({ hasError: true });
  }

  render() {
    return this.state.hasError ? <AppError /> : this.props.children;
  }
}

export default ErrorBoundary;
