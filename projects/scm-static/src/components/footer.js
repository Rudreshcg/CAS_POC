import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './footer.css'

const Footer = (props) => {
  return (
    <div className={`footer-thq-footer-elm ${props.rootClassName} `}>
      <div className="footer-thq-footer-top-elm">
        <div className="footer-thq-brand-elm">
          <div className="footer-thq-logo-container-elm">
            <img
              alt={props.imageAlt}
              src={props.imageSrc}
              loading="eager"
              className="footer-image"
            />
            <span className="footer-text10">
              {props.text5 ?? (
                <Fragment>
                  <span className="footer-text21"> Apollo</span>
                </Fragment>
              )}
            </span>
          </div>
          <span className="footer-text11">
            {props.text1 ?? (
              <Fragment>
                <span className="footer-text29">
                  Always Ready. Always Ahead.
                </span>
              </Fragment>
            )}
          </span>
          <div className="footer-thq-teal-line-elm"></div>
          <span className="footer-text12">
            {props.text2 ?? (
              <Fragment>
                <span className="footer-text18">
                  AI-powered procurement intelligence for enterprise buying
                  teams.
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="footer-thq-products-elm">
          <span className="footer-thq-product-elm">
            {props.product ?? (
              <Fragment>
                <span className="footer-text23">PRODUCT</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-apollo-platform-elm">
            {props.apolloPlatform ?? (
              <Fragment>
                <span className="footer-text34">Apollo Platform</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-margin-expansion-elm">
            {props.marginExpansion ?? (
              <Fragment>
                <span className="footer-text24">Margin Expansion</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-margin-protection-elm">
            {props.marginProtection ?? (
              <Fragment>
                <span className="footer-text16">Margin Protection</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-productivity-elm">
            {props.productivity ?? (
              <Fragment>
                <span className="footer-text17">Productivity</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-data-analytics-elm">
            {props.dataAnalytics ?? (
              <Fragment>
                <span className="footer-text33">Data &amp; Analytics</span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="footer-thq-services-elm1">
          <span className="footer-thq-services-elm2">
            {props.services ?? (
              <Fragment>
                <span className="footer-text30">SERVICES</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-buying-services-elm">
            {props.buyingServices ?? (
              <Fragment>
                <span className="footer-text22">Buying Services</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-consulting-elm">
            {props.consulting ?? (
              <Fragment>
                <span className="footer-text36">Consulting</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-data-services-elm">
            {props.dataServices ?? (
              <Fragment>
                <span className="footer-text32">Data Services</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-forward-deployed-engineers-elm">
            {props.forwardDeployedEngineers ?? (
              <Fragment>
                <span className="footer-text28">
                  Forward Deployed Engineers
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="footer-thq-company-elm1">
          <span className="footer-thq-company-elm2">
            {props.company ?? (
              <Fragment>
                <span className="footer-text26">COMPANY</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-about-elm">
            {props.about ?? (
              <Fragment>
                <span className="footer-text31">About</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-careers-elm">
            {props.careers ?? (
              <Fragment>
                <span className="footer-text20">Careers</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-blog-elm">
            {props.blog ?? (
              <Fragment>
                <span className="footer-text19">Blog</span>
              </Fragment>
            )}
          </span>
          <span className="footer-thq-contact-us-elm">
            {props.contactUs ?? (
              <Fragment>
                <span className="footer-text35">Contact Us</span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="footer-thq-empty-column-elm"></div>
      </div>
      <div className="footer-thq-footer-bottom-bar-elm">
        <span className="footer-text13">
          {props.text ?? (
            <Fragment>
              <span className="footer-text25">
                © 2026 SCMmax Consulting Inc. All rights reserved.
                <span
                  dangerouslySetInnerHTML={{
                    __html: ' ',
                  }}
                />
              </span>
            </Fragment>
          )}
        </span>
        <div className="footer-thq-privacy-terms-of-service-row-elm">
          <span className="footer-text14">
            {props.text3 ?? (
              <Fragment>
                <span className="footer-text27">Privacy Policy</span>
              </Fragment>
            )}
          </span>
          <span className="footer-text15">
            {props.text4 ?? (
              <Fragment>
                <span className="footer-text37">Terms of Service</span>
              </Fragment>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

Footer.defaultProps = {
  marginProtection: undefined,
  productivity: undefined,
  text2: undefined,
  rootClassName: '',
  blog: undefined,
  careers: undefined,
  text5: undefined,
  buyingServices: undefined,
  product: undefined,
  marginExpansion: undefined,
  text: undefined,
  company: undefined,
  imageSrc: '/logo%20-%20final%20-%20black%20background%20-%20small-200h.png',
  text3: undefined,
  forwardDeployedEngineers: undefined,
  text1: undefined,
  services: undefined,
  about: undefined,
  imageAlt: 'logo',
  dataServices: undefined,
  dataAnalytics: undefined,
  apolloPlatform: undefined,
  contactUs: undefined,
  consulting: undefined,
  text4: undefined,
}

Footer.propTypes = {
  marginProtection: PropTypes.element,
  productivity: PropTypes.element,
  text2: PropTypes.element,
  rootClassName: PropTypes.string,
  blog: PropTypes.element,
  careers: PropTypes.element,
  text5: PropTypes.element,
  buyingServices: PropTypes.element,
  product: PropTypes.element,
  marginExpansion: PropTypes.element,
  text: PropTypes.element,
  company: PropTypes.element,
  imageSrc: PropTypes.string,
  text3: PropTypes.element,
  forwardDeployedEngineers: PropTypes.element,
  text1: PropTypes.element,
  services: PropTypes.element,
  about: PropTypes.element,
  imageAlt: PropTypes.string,
  dataServices: PropTypes.element,
  dataAnalytics: PropTypes.element,
  apolloPlatform: PropTypes.element,
  contactUs: PropTypes.element,
  consulting: PropTypes.element,
  text4: PropTypes.element,
}

export default Footer
