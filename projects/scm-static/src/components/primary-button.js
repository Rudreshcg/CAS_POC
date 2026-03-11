import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './primary-button.css'

const PrimaryButton = (props) => {
  return (
    <div className={`primary-button-container ${props.rootClassName} `}>
      <button
        type="button"
        className="primary-button-thq-primary-button-test-elm button"
      >
        <span>
          {props.primaryButtonTest ?? (
            <Fragment>
              <span className="primary-button-text2">Button</span>
            </Fragment>
          )}
        </span>
      </button>
    </div>
  )
}

PrimaryButton.defaultProps = {
  rootClassName: '',
  primaryButtonTest: undefined,
}

PrimaryButton.propTypes = {
  rootClassName: PropTypes.string,
  primaryButtonTest: PropTypes.element,
}

export default PrimaryButton
