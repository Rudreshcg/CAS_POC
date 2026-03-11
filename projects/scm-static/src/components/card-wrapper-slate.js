import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './card-wrapper-slate.css'

const CardWrapperSlate = (props) => {
  return (
    <div
      className={`card-wrapper-slate-thq-card-wrapper-slate-elm ${props.rootClassName} `}
    >
      <div className="card-wrapper-slate-thq-top-accent-bar-elm"></div>
      <div className="card-wrapper-slate-thq-card-body-elm">
        <span className="card-wrapper-slate-thq-eye-brow-elm">
          {props.eyeBrow ?? (
            <Fragment>
              <span className="card-wrapper-slate-text2">Operational AI</span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-slate-thq-title-elm">
          {props.title ?? (
            <Fragment>
              <span className="card-wrapper-slate-text5">
                Automated Quote Initiation &amp; Selection
              </span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-slate-thq-body-text-elm">
          {props.bodyText ?? (
            <Fragment>
              <span className="card-wrapper-slate-text3">
                The AI agent uses MRP output, initiates RFQ and compares the
                emails from suppliers or the uploads to Ariba
              </span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="card-wrapper-slate-thq-card-footer-elm">
        <span className="card-wrapper-slate-thq-tag-elm">
          {props.tag ?? (
            <Fragment>
              <span className="card-wrapper-slate-text4">AQS Agent</span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-slate-thq-link-elm">
          {props.link ?? (
            <Fragment>
              <span className="card-wrapper-slate-text1">Explore-&gt;</span>
            </Fragment>
          )}
        </span>
      </div>
    </div>
  )
}

CardWrapperSlate.defaultProps = {
  link: undefined,
  eyeBrow: undefined,
  bodyText: undefined,
  tag: undefined,
  rootClassName: '',
  title: undefined,
}

CardWrapperSlate.propTypes = {
  link: PropTypes.element,
  eyeBrow: PropTypes.element,
  bodyText: PropTypes.element,
  tag: PropTypes.element,
  rootClassName: PropTypes.string,
  title: PropTypes.element,
}

export default CardWrapperSlate
