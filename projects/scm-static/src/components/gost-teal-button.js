import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './gost-teal-button.css'

const GostTealButton = (props) => {
  return (
    <div className={`gost-teal-button-container ${props.rootClassName} `}>
      <button
        type="button"
        className="gost-teal-button-thq-gost-teal-button-elm button"
      >
        <span>
          {props.gostTealButton ?? (
            <Fragment>
              <span className="gost-teal-button-text2">Button</span>
            </Fragment>
          )}
        </span>
      </button>
    </div>
  )
}

GostTealButton.defaultProps = {
  gostTealButton: undefined,
  rootClassName: '',
}

GostTealButton.propTypes = {
  gostTealButton: PropTypes.element,
  rootClassName: PropTypes.string,
}

export default GostTealButton
