import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './primary-button.css'

const PrimaryButton = (props) => {
  if (props.link) {
    return (
      <div className={`primary-button-container ${props.rootClassName} `}>
        <a
          href={props.link}
          target="_blank"
          rel="noreferrer noopener"
          className="primary-button-thq-primary-button-test-elm button"
        >
          <span>
            {props.primaryButtonTest ?? (
              <Fragment>
                <span className="primary-button-text2">Button</span>
              </Fragment>
            )}
          </span>
        </a>
      </div>
    )
  }
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
  link: '',
}

PrimaryButton.propTypes = {
  rootClassName: PropTypes.string,
  primaryButtonTest: PropTypes.element,
  link: PropTypes.string,
}

export default PrimaryButton
