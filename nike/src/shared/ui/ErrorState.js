import React from 'react';
import PropTypes from 'prop-types';

const ErrorState = ({ title, error, icon, action }) => {
  return (
    <div className="error-state">
      {icon && <div className="error-state__icon">{icon}</div>}
      <h3 className="error-state__title">{title}</h3>
      {error && (
        <p className="error-state__error">
          {typeof error === 'string' ? error : 'An unexpected error occurred.'}
        </p>
      )}
      {action && <div className="error-state__action">{action}</div>}
    </div>
  );
};

ErrorState.propTypes = {
  title: PropTypes.string.isRequired,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  icon: PropTypes.node,
  action: PropTypes.node,
};

export default ErrorState;