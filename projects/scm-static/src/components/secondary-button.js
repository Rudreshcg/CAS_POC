import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './secondary-button.css'

const SecondaryButton = (props) => {
  return (
    <div className={`secondary-button-container ${props.rootClassName} `}>
      <button
        type="button"
        className="secondary-button-thq-secondary-button-elm button"
      >
        <span>
          {props.secondaryButton ?? (
            <Fragment>
              <span className="secondary-button-text2">Button</span>
            </Fragment>
          )}
        </span>
      </button>
    </div>
  )
}

SecondaryButton.defaultProps = {
  rootClassName: '',
  secondaryButton: undefined,
}

SecondaryButton.propTypes = {
  rootClassName: PropTypes.string,
  secondaryButton: PropTypes.element,
}

export default SecondaryButton
