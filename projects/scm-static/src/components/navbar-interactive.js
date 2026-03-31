import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'

import Script from 'dangerous-html/react'
import PropTypes from 'prop-types'

import './navbar-interactive.css'

const NavbarInteractive = (props) => {
  return (
    <div className={`navbar-interactive-container1 ${props.rootClassName} `}>
      <header
        data-thq="thq-navbar"
        className="navbar-interactive-thq-navbar-interactive-elm"
      >
        <Link to="/" className="navbar-interactive-navlink1">
          <img
            alt={props.imageAlt}
            src={props.imageSrc}
            loading="eager"
            className="navbar-interactive-image"
          />
        </Link>
        <Link to="/" className="navbar-interactive-navlink2">
          {props.text ?? (
            <Fragment>
              <span className="navbar-interactive-text18"> Apollo</span>
            </Fragment>
          )}
        </Link>
        <div
          data-thq="thq-navbar-nav"
          className="navbar-interactive-thq-desktop-menu-elm"
        >
          <nav className="navbar-interactive-thq-links-elm1">
            <Link to="/" className="navbar-interactive-thq-home-elm1">
              {props.home ?? (
                <Fragment>
                  <span className="navbar-interactive-text14">Home</span>
                </Fragment>
              )}
            </Link>
            <Link
              to="/products"
              className="navbar-interactive-thq-products-elm1"
            >
              {props.products ?? (
                <Fragment>
                  <span className="navbar-interactive-text15">Products</span>
                </Fragment>
              )}
            </Link>
            <Link
              to="/services"
              className="navbar-interactive-thq-services-elm1"
            >
              {props.services ?? (
                <Fragment>
                  <span className="navbar-interactive-text12">Services</span>
                </Fragment>
              )}
            </Link>
          </nav>
          <div className="navbar-interactive-thq-buttons-elm1">
            <a
              href="https://outlook.office.com/bookwithme/user/8b876d6424a5445e960d92a2a28db077@scmmax.com/meetingtype/NvRUL87SiUuK83_PAIvasw2?anonymous&ismsaljsauthenabled&ep=mlink"
              target="_blank"
              rel="noreferrer noopener"
              className="navbar-interactive-thq-register-elm button"
            >
              <span>
                {props.register ?? (
                  <Fragment>
                    <span className="navbar-interactive-text17">
                      request Demo
                    </span>
                  </Fragment>
                )}
              </span>
            </a>
          </div>
        </div>
        <div
          data-thq="thq-burger-menu"
          className="navbar-interactive-thq-burger-menu-elm"
        >
          <svg viewBox="0 0 1024 1024" className="navbar-interactive-icon10">
            <path d="M128 554.667h768c23.552 0 42.667-19.115 42.667-42.667s-19.115-42.667-42.667-42.667h-768c-23.552 0-42.667 19.115-42.667 42.667s19.115 42.667 42.667 42.667zM128 298.667h768c23.552 0 42.667-19.115 42.667-42.667s-19.115-42.667-42.667-42.667h-768c-23.552 0-42.667 19.115-42.667 42.667s19.115 42.667 42.667 42.667zM128 810.667h768c23.552 0 42.667-19.115 42.667-42.667s-19.115-42.667-42.667-42.667h-768c-23.552 0-42.667 19.115-42.667 42.667s19.115 42.667 42.667 42.667z"></path>
          </svg>
          <div>
            <div className="navbar-interactive-container3">
              <Script
                html={`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
  style="display:block;cursor:pointer;flex-shrink:0;">
  <path d="M3 6H21" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
  <path d="M3 12H21" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
  <path d="M3 18H21" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
</svg>`}
              ></Script>
            </div>
          </div>
        </div>
        <div
          data-thq="thq-mobile-menu"
          className="navbar-interactive-thq-mobile-menu-elm"
        >
          <div className="navbar-interactive-thq-nav-elm">
            <div className="navbar-interactive-thq-top-elm">
              <img
                src="/logo%20-%20final%20-%20black%20background%20-%20small-1500h.png"
                alt="image"
                className="navbar-interactive-thq-logo-elm"
              />
              <Link to="/" className="navbar-interactive-navlink3">
                {props.text8 ?? (
                  <Fragment>
                    <span className="navbar-interactive-text20"> Apollo</span>
                  </Fragment>
                )}
              </Link>
              <div
                data-thq="thq-close-menu"
                className="navbar-interactive-thq-close-menu-elm"
              >
                <svg
                  viewBox="0 0 1024 1024"
                  className="navbar-interactive-icon12"
                >
                  <path d="M810 274l-238 238 238 238-60 60-238-238-238 238-60-60 238-238-238-238 60-60 238 238 238-238z"></path>
                </svg>
                <div>
                  <div className="navbar-interactive-container5">
                    <Script
                      html={`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
  style="display:block;cursor:pointer;flex-shrink:0;">
  <path d="M18 6L6 18" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
  <path d="M6 6L18 18" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
</svg>`}
                    ></Script>
                  </div>
                </div>
              </div>
            </div>
            <nav className="navbar-interactive-thq-links-elm2">
              <Link to="/" className="navbar-interactive-thq-home-elm2">
                {props.text3 ?? (
                  <Fragment>
                    <span className="navbar-interactive-text13">Home</span>
                  </Fragment>
                )}
              </Link>
              <Link
                to="/products"
                className="navbar-interactive-thq-products-elm2"
              >
                {props.text4 ?? (
                  <Fragment>
                    <span className="navbar-interactive-text16">Products</span>
                  </Fragment>
                )}
              </Link>
              <Link
                to="/services"
                className="navbar-interactive-thq-services-elm2"
              >
                {props.text5 ?? (
                  <Fragment>
                    <span className="navbar-interactive-text19">Services</span>
                  </Fragment>
                )}
              </Link>
            </nav>
            <div className="navbar-interactive-thq-buttons-elm2">
              <div className="navbar-interactive-container6">
                <a
                  href="https://outlook.office.com/bookwithme/user/8b876d6424a5445e960d92a2a28db077@scmmax.com/meetingtype/NvRUL87SiUuK83_PAIvasw2?anonymous&ismsaljsauthenabled&ep=mlink"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="navbar-interactive-thq-primary-button-test-elm button"
                >
                  <span>
                    {props.primaryButtonTest ?? (
                      <Fragment>
                        <span className="navbar-interactive-text21">
                          Request Demo
                        </span>
                      </Fragment>
                    )}
                  </span>
                </a>
              </div>
            </div>
          </div>
          <div>
            <svg
              viewBox="0 0 950.8571428571428 1024"
              className="navbar-interactive-icon14"
            >
              <path d="M925.714 233.143c-25.143 36.571-56.571 69.143-92.571 95.429 0.571 8 0.571 16 0.571 24 0 244-185.714 525.143-525.143 525.143-104.571 0-201.714-30.286-283.429-82.857 14.857 1.714 29.143 2.286 44.571 2.286 86.286 0 165.714-29.143 229.143-78.857-81.143-1.714-149.143-54.857-172.571-128 11.429 1.714 22.857 2.857 34.857 2.857 16.571 0 33.143-2.286 48.571-6.286-84.571-17.143-148-91.429-148-181.143v-2.286c24.571 13.714 53.143 22.286 83.429 23.429-49.714-33.143-82.286-89.714-82.286-153.714 0-34.286 9.143-65.714 25.143-93.143 90.857 112 227.429 185.143 380.571 193.143-2.857-13.714-4.571-28-4.571-42.286 0-101.714 82.286-184.571 184.571-184.571 53.143 0 101.143 22.286 134.857 58.286 41.714-8 81.714-23.429 117.143-44.571-13.714 42.857-42.857 78.857-81.143 101.714 37.143-4 73.143-14.286 106.286-28.571z"></path>
            </svg>
            <svg
              viewBox="0 0 877.7142857142857 1024"
              className="navbar-interactive-icon16"
            >
              <path d="M585.143 512c0-80.571-65.714-146.286-146.286-146.286s-146.286 65.714-146.286 146.286 65.714 146.286 146.286 146.286 146.286-65.714 146.286-146.286zM664 512c0 124.571-100.571 225.143-225.143 225.143s-225.143-100.571-225.143-225.143 100.571-225.143 225.143-225.143 225.143 100.571 225.143 225.143zM725.714 277.714c0 29.143-23.429 52.571-52.571 52.571s-52.571-23.429-52.571-52.571 23.429-52.571 52.571-52.571 52.571 23.429 52.571 52.571zM438.857 152c-64 0-201.143-5.143-258.857 17.714-20 8-34.857 17.714-50.286 33.143s-25.143 30.286-33.143 50.286c-22.857 57.714-17.714 194.857-17.714 258.857s-5.143 201.143 17.714 258.857c8 20 17.714 34.857 33.143 50.286s30.286 25.143 50.286 33.143c57.714 22.857 194.857 17.714 258.857 17.714s201.143 5.143 258.857-17.714c20-8 34.857-17.714 50.286-33.143s25.143-30.286 33.143-50.286c22.857-57.714 17.714-194.857 17.714-258.857s5.143-201.143-17.714-258.857c-8-20-17.714-34.857-33.143-50.286s-30.286-25.143-50.286-33.143c-57.714-22.857-194.857-17.714-258.857-17.714zM877.714 512c0 60.571 0.571 120.571-2.857 181.143-3.429 70.286-19.429 132.571-70.857 184s-113.714 67.429-184 70.857c-60.571 3.429-120.571 2.857-181.143 2.857s-120.571 0.571-181.143-2.857c-70.286-3.429-132.571-19.429-184-70.857s-67.429-113.714-70.857-184c-3.429-60.571-2.857-120.571-2.857-181.143s-0.571-120.571 2.857-181.143c3.429-70.286 19.429-132.571 70.857-184s113.714-67.429 184-70.857c60.571-3.429 120.571-2.857 181.143-2.857s120.571-0.571 181.143 2.857c70.286 3.429 132.571 19.429 184 70.857s67.429 113.714 70.857 184c3.429 60.571 2.857 120.571 2.857 181.143z"></path>
            </svg>
            <svg
              viewBox="0 0 602.2582857142856 1024"
              className="navbar-interactive-icon18"
            >
              <path d="M548 6.857v150.857h-89.714c-70.286 0-83.429 33.714-83.429 82.286v108h167.429l-22.286 169.143h-145.143v433.714h-174.857v-433.714h-145.714v-169.143h145.714v-124.571c0-144.571 88.571-223.429 217.714-223.429 61.714 0 114.857 4.571 130.286 6.857z"></path>
            </svg>
          </div>
        </div>
      </header>
    </div>
  )
}

NavbarInteractive.defaultProps = {
  services: undefined,
  text3: undefined,
  home: undefined,
  products: undefined,
  text4: undefined,
  register: undefined,
  imageSrc: '/logo%20-%20final%20-%20black%20background%20-%20small-1500h.png',
  rootClassName: '',
  text: undefined,
  text5: undefined,
  imageAlt: 'logo',
  text8: undefined,
  primaryButtonTest: undefined,
}

NavbarInteractive.propTypes = {
  services: PropTypes.element,
  text3: PropTypes.element,
  home: PropTypes.element,
  products: PropTypes.element,
  text4: PropTypes.element,
  register: PropTypes.element,
  imageSrc: PropTypes.string,
  rootClassName: PropTypes.string,
  text: PropTypes.element,
  text5: PropTypes.element,
  imageAlt: PropTypes.string,
  text8: PropTypes.element,
  primaryButtonTest: PropTypes.element,
}

export default NavbarInteractive
