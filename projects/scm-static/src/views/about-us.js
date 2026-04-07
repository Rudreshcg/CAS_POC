import React, { useState, Fragment } from 'react'
import { Link } from 'react-router-dom'

import Script from 'dangerous-html/react'
import { Helmet } from 'react-helmet'

import NavbarInteractive from '../components/navbar-interactive'
import Footer from '../components/footer'
import './about-us.css'

const AboutUs = (props) => {
  const handleDemoLink = () => {
    window.open('https://outlook.office.com/book/RequestDemoSchedulingPage@scmmax.com/?ismsaljsauthenabled', '_blank');
  }
  return (
    <div className="about-us-container1">
      <Helmet>
        <title>About-Us - Practical Mean Cassowary</title>
        <meta
          property="og:title"
          content="About-Us - Practical Mean Cassowary"
        />
        <link
          rel="canonical"
          href="https://practical-mean-cassowary-094j40.teleporthq.site/about-us"
        />
        <meta
          property="og:url"
          content="https://practical-mean-cassowary-094j40.teleporthq.site/about-us"
        />
      </Helmet>
      <NavbarInteractive
        home={
          <Fragment>
            <span className="about-us-text10">Home</span>
          </Fragment>
        }
        text={
          <Fragment>
            <span className="about-us-text11"> Apollo</span>
          </Fragment>
        }
        text1={
          <Fragment>
            <span className="about-us-text12">About Us</span>
          </Fragment>
        }
        text3={
          <Fragment>
            <span className="about-us-text13">Home</span>
          </Fragment>
        }
        text4={
          <Fragment>
            <span className="about-us-text14">Products</span>
          </Fragment>
        }
        text5={
          <Fragment>
            <span className="about-us-text15">Services</span>
          </Fragment>
        }
        text8={
          <Fragment>
            <span className="about-us-text16"> Apollo</span>
          </Fragment>
        }
        text51={
          <Fragment>
            <span className="about-us-text17">Careers</span>
          </Fragment>
        }
        products={
          <Fragment>
            <span className="about-us-text18">Products</span>
          </Fragment>
        }
        register={
          <Fragment>
            <span className="about-us-text19">request Demo</span>
          </Fragment>
        }
        services={
          <Fragment>
            <span className="about-us-text20">Services</span>
          </Fragment>
        }
        services2={
          <Fragment>
            <span className="about-us-text21">About Us</span>
          </Fragment>
        }
        rootClassName="navbar-interactiveroot-class-name4"
        primaryButtonTest={
          <Fragment>
            <span className="about-us-text22">Request Demo</span>
          </Fragment>
        }
      ></NavbarInteractive>
      <div className="about-us-thq-hero-outer-elm">
        <div className="about-us-thq-hero-inner-elm">
          <div className="about-us-thq-left-column-elm">
            <div className="about-us-thq-eyebrow-elm1">
              <div className="about-us-thq-line-elm1"></div>
              <span className="about-us-text23">About SCMMAX</span>
            </div>
            <div className="about-us-thq-headline-column-elm1">
              <span className="about-us-thq-headline1-elm1">
                Procurement intelligence
              </span>
              <span className="about-us-thq-headline2-elm1">
                for the people who
              </span>
              <span className="about-us-thq-headline3-elm1">
                run it every day.
              </span>
            </div>
            <span className="about-us-thq-subheading-elm1">
              SCMMAX is a procurement intelligence company. We build AI that
              gives enterprise procurement teams the market knowledge, supplier
              intelligence, and analytical depth that only the best-resourced
              organisations previously had access to.
            </span>
          </div>
          <div className="about-us-thq-right-column-elm1">
            <div className="about-us-thq-problem-card-elm">
              <div className="about-us-thq-ps1-elm">
                <div className="about-us-thq-quote-row-elm1">
                  <span className="about-us-thq-quote-mark-elm1">❝</span>
                  <span className="about-us-thq-statement-elm1">
                    We negotiate without knowing what the material should
                    actually cost.
                  </span>
                </div>
                <div className="about-us-thq-answer-row-elm1">
                  <span className="about-us-thq-answer-text-elm1">
                    Apollo builds bottom-up should-cost models for every direct
                    material — updated continuously as commodity markets move —
                    so your buyers walk into every negotiation knowing the
                    number before the supplier does.
                  </span>
                </div>
              </div>
              <div className="about-us-thq-ps2-elm1">
                <div className="about-us-thq-quote-row-elm2">
                  <span className="about-us-thq-quote-mark-elm2">❝</span>
                  <span className="about-us-thq-statement-elm2">
                    Our spend data is too dirty to trust for any real analysis.
                  </span>
                </div>
                <div className="about-us-thq-answer-row-elm2">
                  <span className="about-us-thq-answer-text-elm2">
                    Apollo&apos;s first act is cleaning your ERP data —
                    deduplicating material records, resolving supplier names,
                    enriching thin descriptions — so every recommendation it
                    makes is built on a foundation you can defend.
                  </span>
                </div>
              </div>
              <div className="about-us-thq-ps2-elm2">
                <div className="about-us-thq-quote-row-elm3">
                  <span className="about-us-thq-quote-mark-elm3">❝</span>
                  <span className="about-us-thq-statement-elm3">
                    By the time we act on a market signal, the window has
                    already closed.
                  </span>
                </div>
                <div className="about-us-thq-answer-row-elm3">
                  <span className="about-us-thq-answer-text-elm3">
                    Apollo monitors your categories, your suppliers, and
                    commodity markets continuously — surfacing buying
                    opportunities, price alerts, and risk signals before your
                    team would have found them manually.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="about-us-container3">
            <Script
              html={`<div style="line-height:0;margin:0;padding:0;display:block;overflow:hidden;width:100%;">
  <svg viewBox="0 0 1440 48" fill="none" preserveAspectRatio="none" style="display:block;width:100%;height:48px;">
    <path d="M0 0 L1440 0 L1440 24 Q1080 48 720 40 Q360 32 0 48 Z" fill="#0F1421" />
    <path d="M0 48 Q360 32 720 40 Q1080 48 1440 24 L1440 48 Z" fill="#F4F6FA" />
  </svg>
</div>`}
            ></Script>
          </div>
        </div>
      </div>
      <div className="about-us-thq-mission-column-elm">
        <div className="about-us-thq-mission-inner-elm">
          <div className="about-us-thq-left-c-olumn-elm">
            <div className="about-us-thq-eyebrow-elm2">
              <div className="about-us-thq-line-elm2"></div>
              <span className="about-us-text24">About SCMMAX</span>
            </div>
            <div className="about-us-thq-headline-column-elm2">
              <span className="about-us-thq-headline1-elm2">
                The procurement gap
              </span>
              <span className="about-us-thq-headline2-elm2">
                is a solvable problem.
              </span>
            </div>
            <div className="about-us-thq-body-text-elm">
              <span className="about-us-thq-para1-elm">
                Most enterprise procurement teams are managing hundreds of
                millions — sometimes billions — of dollars in direct spend with
                tools that were built to manage process, not create
                intelligence. They track purchase orders. They route approvals.
                They store contracts. But they don&apos;t help buyers understand
                what a material should cost, when to buy, which suppliers are at
                risk, or where the best savings opportunities are hiding.
              </span>
              <span className="about-us-thq-para2-elm">
                The result is that procurement decisions — which directly affect
                company margins — are made on instinct, habit, and incomplete
                information. The market intelligence that would change these
                decisions exists. It&apos;s just scattered, unstructured, and
                inaccessible at the speed and scale procurement teams need it.
              </span>
              <span className="about-us-thq-para3-elm">
                SCMMAX was built to close that gap. Apollo is the intelligence
                layer that sits alongside your existing ERP and procurement
                systems, reading your data, understanding your context, and
                surfacing the decisions that matter — before the window closes.
              </span>
            </div>
          </div>
          <div className="about-us-thq-right-column-elm2">
            <div className="about-us-thq-eyebrow-elm3">
              <div className="about-us-thq-line-elm3"></div>
              <span className="about-us-text25">What We Believe</span>
            </div>
            <div className="about-us-thq-belief-cards-c-olumn-elm">
              <div className="about-us-thq-belief1-elm">
                <span className="about-us-thq-number-elm1">01</span>
                <span className="about-us-thq-titlle-elm1">
                  Domain depth makes AI actually useful
                </span>
                <span className="about-us-thq-desc-elm10">
                  General AI applied to procurement produces generic output.
                  Apollo is built by people who understand procurement — which
                  means the recommendations are specific, defensible, and
                  actionable.
                </span>
              </div>
              <div className="about-us-thq-belief2-elm">
                <span className="about-us-thq-number-elm2">02</span>
                <span className="about-us-thq-titlle-elm2">
                  Your data belongs to you — full stop
                </span>
                <span className="about-us-thq-desc-elm11">
                  Enterprise procurement data is commercially sensitive. Apollo
                  runs inside your environment. Your spend data never leaves
                  your infrastructure, never trains a shared model, and is never
                  accessible to us.
                </span>
              </div>
              <div className="about-us-thq-belief3-elm">
                <span className="about-us-thq-number-elm3">03</span>
                <span className="about-us-thq-titlle-elm3">
                  Speed to value is a design principle
                </span>
                <span className="about-us-thq-desc-elm12">
                  Enterprise software implementations that take 18 months are
                  not solving the problem — they are the problem. Apollo goes
                  live in 60–90 days. The first category scan typically surfaces
                  3–8% cost reduction within 90 days of go-live.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="about-us-thq-problem-section-outer-elm">
        <div className="about-us-thq-problem-inner-elm">
          <div className="about-us-thq-header-elm1">
            <div className="about-us-thq-eyebrow-elm4">
              <div className="about-us-thq-line-elm4"></div>
              <span className="about-us-text26">
                The Problem We&apos;re Solving
              </span>
            </div>
            <div className="about-us-thq-headline-column-elm3">
              <span className="about-us-thq-headline1-elm3">
                What enterprise procurement
              </span>
              <span className="about-us-thq-headline3-elm2">
                is missing right now.
              </span>
            </div>
            <span className="about-us-thq-subheading-elm2">
              SCMMAX is a procurement intelligence company. We build AI that
              gives enterprise procurement teams the market knowledge, supplier
              intelligence, and analytical depth that only the best-resourced
              organisations previously had access to.
            </span>
          </div>
          <div className="about-us-thq-problem-rows-elm">
            <div className="about-us-thq-problem1-elm">
              <span className="about-us-thq-icon-elm1">📉</span>
              <span className="about-us-thq-title-elm1">
                No market intelligence at the point of decision
              </span>
              <span className="about-us-thq-desc-elm13">
                Buyers many a time end up negotiating without knowing what a
                material actually costs to produce, what commodity markets are
                doing, or whether the supplier&apos;s price increase is
                justified.
              </span>
            </div>
            <div className="about-us-thq-problem2-elm">
              <span className="about-us-thq-icon-elm2">🗂️</span>
              <span className="about-us-thq-title-elm2">
                Spend data that can&apos;t be trusted
              </span>
              <span className="about-us-thq-desc-elm14">
                Duplicate material records, inconsistent supplier names, and
                fragmented category data make it impossible to understand
                what&apos;s actually being spent and with whom.
              </span>
            </div>
            <div className="about-us-thq-problem3-elm">
              <span className="about-us-thq-icon-elm3">⏰</span>
              <span className="about-us-thq-title-elm3">
                Decisions made too slowly
              </span>
              <span className="about-us-thq-desc-elm15">
                Market windows open and close in days. By the time a buying
                recommendation reaches a decision maker, the opportunity has
                passed or the risk has already materialised.
              </span>
            </div>
          </div>
          <div className="about-us-thq-arrow-row-elm">
            <span className="about-us-text27">⬇️</span>
            <span className="about-us-text28">
              Apollo is built to close each of these gaps — working alongside
              your existing systems, not replacing them.
            </span>
            <span className="about-us-text29">⬇️</span>
          </div>
          <div className="about-us-thq-solution-row-elm">
            <div className="about-us-thq-solution1-elm">
              <span className="about-us-thq-title-elm4">
                Intelligence at the point of decision
              </span>
              <span className="about-us-thq-desc-elm16">
                Should-cost models, price forecasts, and negotiation playbooks
                generated automatically — before every supplier meeting, every
                renewal, every buying decision.
              </span>
            </div>
            <div className="about-us-thq-solution2-elm">
              <span className="about-us-thq-title-elm5">
                Clean, AI-interpretable data
              </span>
              <span className="about-us-thq-desc-elm17">
                Apollo&apos;s data agents deduplicate, enrich, and standardise
                your material and supplier master data — creating the foundation
                every other agent depends on.
              </span>
            </div>
            <div className="about-us-thq-solution3-elm">
              <span className="about-us-thq-title-elm6">
                Decisions in hours, not weeks
              </span>
              <span className="about-us-thq-desc-elm18">
                Apollo monitors your spend, your markets, and your supply base
                continuously — surfacing alerts, opportunities, and
                recommendations as they emerge, not after the fact.
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="about-us-thq-work-section-elm">
        <div className="about-us-thq-work-inner-elm">
          <div className="about-us-thq-header-elm2">
            <div className="about-us-thq-eyebrow-elm5">
              <div className="about-us-thq-line-elm5"></div>
              <span className="about-us-text30">How We Work</span>
            </div>
            <div className="about-us-thq-headline-column-elm4">
              <span className="about-us-thq-headline1-elm4">
                The principles behind
              </span>
              <span className="about-us-thq-headline3-elm3">
                everything Apollo does.
              </span>
            </div>
          </div>
          <div className="about-us-thq-principles-row-elm">
            <div className="about-us-thq-principle1-elm">
              <div className="about-us-thq-accent-bar-elm1"></div>
              <span className="about-us-thq-titlle-elm4">
                No rip-and-replace
              </span>
              <span className="about-us-thq-desc-elm19">
                Apollo connects to SAP, Oracle, Coupa, Ariba, and other ERP and
                procurement systems via secure APIs. Your existing stack stays.
                Apollo adds intelligence to it — not a replacement workflow on
                top of it.
              </span>
            </div>
            <div className="about-us-thq-principle2-elm">
              <div className="about-us-thq-accent-bar-elm2"></div>
              <span className="about-us-thq-titlle-elm5">
                Your environment, always
              </span>
              <span className="about-us-thq-desc-elm20">
                Apollo runs inside your infrastructure — on-premise or your
                private cloud. No spend data is sent to external servers. No
                models are trained on your information. Your data is yours.
              </span>
            </div>
            <div className="about-us-thq-principle3-elm">
              <div className="about-us-thq-accent-bar-elm3"></div>
              <span className="about-us-thq-titlle-elm6">
                Forward Deployed Engineers
              </span>
              <span className="about-us-thq-desc-elm21">
                Every Apollo deployment is supported by a Forward Deployed
                Engineer — an experienced procurement professional embedded with
                your team to configure Apollo, enable your buyers, and ensure
                the platform delivers real value from day one.
              </span>
            </div>
            <div className="about-us-thq-principle4-elm">
              <div className="about-us-thq-accent-bar-elm4"></div>
              <span className="about-us-thq-titlle-elm7">
                Measurable value, monthly
              </span>
              <span className="about-us-thq-desc-elm22">
                Every Apollo customer receives a monthly value report — savings
                identified, decisions supported, and efficiency gains
                documented. We don&apos;t ask you to take the ROI on faith. We
                prove it.
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="about-us-thq-nurbers-section-elm">
        <div className="about-us-thq-numbers-inner-elm">
          <div className="about-us-thq-header-elm3">
            <div className="about-us-thq-eyebrow-elm6">
              <div className="about-us-thq-line-elm6"></div>
              <span className="about-us-text31">By the Numbers</span>
            </div>
            <div className="about-us-thq-headline-column-elm5">
              <span className="about-us-thq-headline1-elm5">Apollo in</span>
              <span className="about-us-thq-headline3-elm4">
                plain numbers.
              </span>
            </div>
          </div>
          <div className="about-us-thq-stats-row-elm">
            <div className="about-us-thq-stat1-elm">
              <span className="about-us-thq-value-elm1">16</span>
              <span className="about-us-thq-label-elm1">
                Procurement agents
              </span>
              <span className="about-us-thq-sub-elm1">
                Each designed for a specific job. All working in concert.
              </span>
            </div>
            <div className="about-us-thq-stat2-elm">
              <span className="about-us-thq-value-elm2">60–90</span>
              <span className="about-us-thq-label-elm2">Days to go live</span>
              <span className="about-us-thq-sub-elm2">
                From contract signing to first agent running on your spend.
              </span>
            </div>
            <div className="about-us-thq-stat3-elm">
              <span className="about-us-thq-value-elm3">3–8%</span>
              <span className="about-us-thq-label-elm3">
                Typical first-scan savings
              </span>
              <span className="about-us-thq-sub-elm3">
                Identified in the first category scan, usually within 90 days.
              </span>
            </div>
            <div className="about-us-thq-stat4-elm">
              <span className="about-us-thq-value-elm4">0</span>
              <span className="about-us-thq-label-elm4">
                Data leaves your environment
              </span>
              <span className="about-us-thq-sub-elm4">
                Apollo runs where your data lives. Always.
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="about-us-thq-cta-strip-elm">
        <div className="about-us-thq-cta-inner-elm">
          <div className="about-us-thq-text-column-elm">
            <div className="about-us-thq-title-column-elm">
              <span className="about-us-text32">See Apollo on</span>
              <span className="about-us-text33">your own spend.</span>
            </div>
            <span className="about-us-thq-subtitle-elm">
              30 minutes. Your data. Our team. No slides.
            </span>
          </div>
          <div className="about-us-thq-button-row-elm">
            <span 
              className="about-us-text34" 
              onClick={handleDemoLink} 
              style={{ cursor: 'pointer' }}
            >
              REQUEST A DEMO
            </span>
            <Link to="/products" style={{ textDecoration: 'none' }}>
              <span className="about-us-text35" style={{ cursor: 'pointer' }}>
                SEE THE PRODUCT
              </span>
            </Link>
          </div>
        </div>
      </div>
      <Footer
        blog={
          <Fragment>
            <span className="about-us-text36">Blog</span>
          </Fragment>
        }
        text={
          <Fragment>
            <span className="about-us-text37">
              © 2026 SCMmax Consulting Inc. All rights reserved.
              <span
                dangerouslySetInnerHTML={{
                  __html: ' ',
                }}
              />
            </span>
          </Fragment>
        }
        about={
          <Fragment>
            <span className="about-us-text38">About</span>
          </Fragment>
        }
        text1={
          <Fragment>
            <span className="about-us-text39">Always Ready. Always Ahead.</span>
          </Fragment>
        }
        text2={
          <Fragment>
            <span className="about-us-text40">
              AI-powered procurement intelligence for enterprise buying teams.
            </span>
          </Fragment>
        }
        text3={
          <Fragment>
            <span className="about-us-text41">Privacy Policy</span>
          </Fragment>
        }
        text4={
          <Fragment>
            <span className="about-us-text42">Terms of Service</span>
          </Fragment>
        }
        text5={
          <Fragment>
            <span className="about-us-text43"> Apollo</span>
          </Fragment>
        }
        careers={
          <Fragment>
            <span className="about-us-text44">Careers</span>
          </Fragment>
        }
        company={
          <Fragment>
            <span className="about-us-text45">COMPANY</span>
          </Fragment>
        }
        product={
          <Fragment>
            <span className="about-us-text46">PRODUCT</span>
          </Fragment>
        }
        services={
          <Fragment>
            <span className="about-us-text47">SERVICES</span>
          </Fragment>
        }
        contactUs={
          <Fragment>
            <span className="about-us-text48">Contact Us</span>
          </Fragment>
        }
        consulting={
          <Fragment>
            <span className="about-us-text49">Consulting</span>
          </Fragment>
        }
        dataServices={
          <Fragment>
            <span className="about-us-text50">Data Services</span>
          </Fragment>
        }
        productivity={
          <Fragment>
            <span className="about-us-text51">Productivity</span>
          </Fragment>
        }
        dataAnalytics={
          <Fragment>
            <span className="about-us-text52">Data &amp; Analytics</span>
          </Fragment>
        }
        rootClassName="footerroot-class-name2"
        apolloPlatform={
          <Fragment>
            <span className="about-us-text53">Apollo Platform</span>
          </Fragment>
        }
        buyingServices={
          <Fragment>
            <span className="about-us-text54">Buying Services</span>
          </Fragment>
        }
        marginExpansion={
          <Fragment>
            <span className="about-us-text55">Margin Expansion</span>
          </Fragment>
        }
        marginProtection={
          <Fragment>
            <span className="about-us-text56">Margin Protection</span>
          </Fragment>
        }
        forwardDeployedEngineers={
          <Fragment>
            <span className="about-us-text57">Forward Deployed Engineers</span>
          </Fragment>
        }
      ></Footer>
    </div>
  )
}

export default AboutUs
