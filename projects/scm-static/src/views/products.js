import React, { useState, Fragment } from 'react'

import Script from 'dangerous-html/react'
import { Helmet } from 'react-helmet'

import NavbarInteractive from '../components/navbar-interactive'
import GostTealButton from '../components/gost-teal-button'
import PrimaryButton from '../components/primary-button'
import './products.css'

const Products = (props) => {
  const [activeCategory, setActiveCategory] = useState(1)
  return (
    <div className="products-container1">
      <Helmet>
        <title>Products - Practical Mean Cassowary</title>
        <meta
          property="og:title"
          content="Products - Practical Mean Cassowary"
        />
        <link
          rel="canonical"
          href="https://practical-mean-cassowary-094j40.teleporthq.app/products"
        />
        <meta
          property="og:url"
          content="https://practical-mean-cassowary-094j40.teleporthq.app/products"
        />
      </Helmet>
      <NavbarInteractive
        home={
          <Fragment>
            <span className="products-text100">Home</span>
          </Fragment>
        }
        text={
          <Fragment>
            <span className="products-text101"> Apollo</span>
          </Fragment>
        }
        login={
          <Fragment>
            <span className="products-text102">Login</span>
          </Fragment>
        }
        text1={
          <Fragment>
            <span className="products-text103">Team</span>
          </Fragment>
        }
        text2={
          <Fragment>
            <span className="products-text104">Blog</span>
          </Fragment>
        }
        text3={
          <Fragment>
            <span className="products-text105">About</span>
          </Fragment>
        }
        text4={
          <Fragment>
            <span className="products-text106">Features</span>
          </Fragment>
        }
        text5={
          <Fragment>
            <span className="products-text107">Pricing</span>
          </Fragment>
        }
        text6={
          <Fragment>
            <span className="products-text108">Team</span>
          </Fragment>
        }
        text7={
          <Fragment>
            <span className="products-text109">Blog</span>
          </Fragment>
        }
        login1={
          <Fragment>
            <span className="products-text110">Login</span>
          </Fragment>
        }
        products={
          <Fragment>
            <span className="products-text111">Products</span>
          </Fragment>
        }
        register={
          <Fragment>
            <span className="products-text112">request Demo</span>
          </Fragment>
        }
        services={
          <Fragment>
            <span className="products-text113">Services</span>
          </Fragment>
        }
        register1={
          <Fragment>
            <span className="products-text114">Register</span>
          </Fragment>
        }
        rootClassName="navbar-interactiveroot-class-name1"
      ></NavbarInteractive>
      <div className="products-thq-product-hero-elm">
        <div className="products-thq-hero-inner-elm">
          <span className="products-thq-eye-brow-elm1">
            ————— Apollo Agent Suite —————
          </span>
          <span className="products-thq-text1-elm">
            Every agent. Every margin.
          </span>
          <span className="products-thq-text2-elm">Always working.</span>
          <span className="products-thq-sub-heading-elm">
            16 procurement agents — each designed for a specific job, all
            working in concert. Apollo reads your ERP data, understands your
            spend context, and acts. No rip-and-replace. No retraining your
            team. Live in 60–90 days.
          </span>
          <div className="products-thq-objection-handling-strip-elm">
            <div className="products-thq-objection1-elm">
              <span className="products-thq-question-text-elm1">
                How is Apollo different from ERP or procurement software?
              </span>
              <span className="products-thq-answer-text-elm1">
                ERP systems &amp; Procurement software manage process. Apollo
                creates intelligence — analysing markets, suppliers, and your
                spend in real time to surface decisions your team hasn&apos;t
                thought of yet.
              </span>
            </div>
            <div className="products-thq-objection2-elm">
              <span className="products-thq-question-text-elm2">
                How long before we see ROI?
              </span>
              <span className="products-thq-answer-text-elm2">
                Most customers see first savings within 90 days. Procurement
                Prism alone typically identifies 3–5% cost reduction potential
                in the first category scan.
              </span>
            </div>
            <div className="products-thq-objection3-elm">
              <span className="products-thq-question-text-elm3">
                Is our data safe?
              </span>
              <span className="products-thq-answer-text-elm3">
                Your data never leaves your environment. Apollo runs inside your
                infrastructure — no data sharing, no model training on your
                spend.
              </span>
            </div>
          </div>
        </div>
        <div className="products-container2">
          <div className="products-container3">
            <Script
              html={`<div style="line-height:0; margin:0; padding:0; display:block; overflow:hidden;">
  <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
    style="display:block;width:100%;height:60px;">
    <path d="M0 0 L1440 0 L1440 0 Q1080 60 720 50 Q360 40 0 60 Z" fill="#0F1421" />
    <path d="M0 60 Q360 40 720 50 Q1080 60 1440 0 L1440 60 Z" fill="#F4F6FA" />
  </svg>
</div>`}
            ></Script>
          </div>
        </div>
      </div>
      <div className="products-thq-agent-suite-section-elm">
        <div className="products-thq-agent-suite-inner-elm">
          <div className="products-thq-section-header-elm">
            <span className="products-thq-eye-brow-elm2">
              —— — The Apollo Agent Suite — — —
            </span>
            <span className="products-thq-title1-elm">
              Built for every margin lever
            </span>
            <span className="products-thq-title2-elm">
              in direct procurement.
            </span>
            <span className="products-thq-sub-title-elm">
              Select a category to explore the agents, what they need, and what
              they deliver — for your procurement team and your P&amp;L.
            </span>
          </div>
          <div className="products-thq-category-tabs-row-elm">
            <div className="products-thq-tab1-wrapper-elm">
              {activeCategory === 1 && (
                <div className="products-thq-tab1-active-elm">
                  <span
                    onClick={() => setActiveCategory(1)}
                    className="products-thq-text-elm1"
                  >
                    Margin Expansion
                  </span>
                </div>
              )}
              {activeCategory !== 1 && (
                <div className="products-thq-tab1-inactive-elm">
                  <span
                    onClick={() => setActiveCategory(1)}
                    className="products-thq-text-elm2"
                  >
                    Margin Expansion
                  </span>
                </div>
              )}
            </div>
            <div className="products-thq-tab2-wrapper-elm">
              {activeCategory === 2 && (
                <div className="products-thq-tab2-active-elm">
                  <span
                    onClick={() => setActiveCategory(2)}
                    className="products-thq-text-elm3"
                  >
                    Margin Protection
                  </span>
                </div>
              )}
              {activeCategory !== 2 && (
                <div className="products-thq-tab2-inactive-elm">
                  <span
                    onClick={() => setActiveCategory(2)}
                    className="products-thq-text-elm4"
                  >
                    Margin Protection
                  </span>
                </div>
              )}
            </div>
            <div className="products-thq-tab3-wrapper-elm">
              {activeCategory === 3 && (
                <div className="products-thq-tab3-active-elm">
                  <span
                    onClick={() => setActiveCategory(3)}
                    className="products-thq-text-elm5"
                  >
                    Productivity Improvement
                  </span>
                </div>
              )}
              {activeCategory !== 3 && (
                <div className="products-thq-tab3-inactive-elm">
                  <span
                    onClick={() => setActiveCategory(3)}
                    className="products-thq-text-elm6"
                  >
                    Productivity Improvement
                  </span>
                </div>
              )}
            </div>
            <div className="products-thq-tab4-wrapper-elm">
              {activeCategory === 4 && (
                <div className="products-thq-tab4-active-elm">
                  <span
                    onClick={() => setActiveCategory(4)}
                    className="products-thq-text-elm7"
                  >
                    Analytics &amp; Data
                  </span>
                </div>
              )}
              {activeCategory !== 4 && (
                <div className="products-thq-tab4-inactive-elm">
                  <span
                    onClick={() => setActiveCategory(4)}
                    className="products-thq-text-elm8"
                  >
                    Analytics &amp; Data
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="products-thq-agent-panels-container-elm">
            {activeCategory === 1 && (
              <div className="products-thq-panel1-margin-expansion-elm">
                <div className="products-thq-procurement-prism-hero-card-elm">
                  <div className="products-thq-left-column-elm1">
                    <div className="products-thq-accent-bar-elm10"></div>
                    <div className="products-thq-left-column-inner-elm1">
                      <span className="products-thq-hero-badge-elm1">
                        Hero Agent
                      </span>
                      <span className="products-thq-agent-title-elm1">
                        Procurement Prism
                      </span>
                      <span className="products-thq-description-elm1">
                        Apollo analyses every direct spend category and
                        individual material — understanding market context,
                        supplier dynamics, and specification details to build a
                        structured, sustainable cost reduction roadmap for your
                        entire direct spend portfolio.
                      </span>
                      <span className="products-thq-inputs-label-elm10">
                        INPUTS NEEDED
                      </span>
                      <div className="products-thq-input-tags-row-elm1">
                        <span className="products-text115">
                          Purchase order history
                        </span>
                        <span className="products-text116">
                          Material master data
                        </span>
                        <span className="products-text117">
                          Supplier contracts
                        </span>
                        <span className="products-text118">
                          Spend categories
                        </span>
                        <span className="products-text119">
                          Commodity market feeds
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="products-thq-right-column-elm1">
                    <div className="products-thq-cpo-outcomes-block-elm1">
                      <span className="products-text120">👤 CPO Outcomes</span>
                      <div className="products-thq-bullet-point1-elm1">
                        <span className="products-text121"> </span>
                        <span className="products-text122">
                          Structured sourcing strategy for 100% of direct spend
                          — not just the top 20%
                        </span>
                      </div>
                      <div className="products-thq-bullet-point2-elm1">
                        <span className="products-text123"> </span>
                        <span className="products-text124">
                          Negotiation levers identified per material — indexed
                          contracts, spec changes, TCO shifts
                        </span>
                      </div>
                      <div className="products-thq-bullet-point3-elm1">
                        <span className="products-text125"> </span>
                        <span className="products-text126">
                          Tail spend brought under management automatically
                        </span>
                      </div>
                      <div className="products-thq-bullet-point4-elm">
                        <span className="products-text127"> </span>
                        <span className="products-text128">
                          Category strategies updated continuously as markets
                          mov
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-divider-elm10"></div>
                    <div className="products-thq-cfo-outcomes-block-elm1">
                      <span className="products-text129">💼 CFO Outcomes</span>
                      <div className="products-thq-bullet-point1-elm2">
                        <span className="products-text130"> </span>
                        <span className="products-text131">
                          3–5% cost reduction identified in first category scan
                          — typically within 90 days
                        </span>
                      </div>
                      <div className="products-thq-bullet-point2-elm2">
                        <span className="products-text132"> </span>
                        <span className="products-text133">
                          Savings are structural, not one-time — indexed
                          contracts prevent cost creep
                        </span>
                      </div>
                      <div className="products-thq-bullet-point3-elm2">
                        <span className="products-text134"> </span>
                        <span className="products-text135">
                          Full spend visibility eliminates maverick buying and
                          leakage
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="products-thq-supporting-cards-row-elm1">
                  <div className="products-thq-material-substitution-card-elm">
                    <div className="products-thq-accent-bar-elm11"></div>
                    <div className="products-thq-card-body-elm10">
                      <span className="products-thq-title-elm10">
                        Material Substitution
                      </span>
                      <span className="products-thq-desc-elm10">
                        Analyses your full material portfolio to identify
                        functionally equivalent lower-cost substitutes —
                        validated against your spec and quality requirements
                        before any recommendation is made.
                      </span>
                      <span className="products-thq-inputs-label-elm11">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm10">
                        <span className="products-text136">
                          Bill of materials
                        </span>
                        <span className="products-text137">Spec sheets</span>
                        <span className="products-text138">Supplier data</span>
                      </div>
                      <div className="products-thq-divider-elm11"></div>
                      <div className="products-thq-cpo-row-elm10">
                        <span className="products-text139"> </span>
                        <span className="products-text140">
                          CPO: Reduces specification risk — substitutes are
                          pre-validated, not guesswork
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm10">
                        <span className="products-text141"> </span>
                        <span className="products-text142">
                          CFO: One-time cost reduction of 3-5% on substituted
                          materials
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm10">
                      <span className="products-text143">Explore →</span>
                    </div>
                  </div>
                  <div className="products-thq-buy-more-now-or-later-card-elm">
                    <div className="products-thq-accent-bar-elm12"></div>
                    <div className="products-thq-card-body-elm11">
                      <span className="products-thq-title-elm11">
                        Buy More Now or Later
                      </span>
                      <span className="products-thq-desc-elm11">
                        Analyses commodity price signals, inventory levels, and
                        demand forecasts to recommend optimal timing and volume
                        for direct material purchases — exploiting the Velocity
                        Gap between market signals and supplier price updates.
                      </span>
                      <span className="products-thq-inputs-label-elm12">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm11">
                        <span className="products-text144">Inventory data</span>
                        <span className="products-text145">Market indices</span>
                        <span className="products-text146">MRP Output</span>
                      </div>
                      <div className="products-thq-divider-elm12"></div>
                      <div className="products-thq-cpo-row-elm11">
                        <span className="products-text147"> </span>
                        <span className="products-text148">
                          CPO: Buying decisions backed by data, not buyer
                          instinct
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm11">
                        <span className="products-text149"> </span>
                        <span className="products-text150">
                          CFO: Reduces material cost variance — buys low, avoids
                          buying high
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm11">
                      <span className="products-text151">Explore →</span>
                    </div>
                  </div>
                  <div className="products-thq-alternate-suppliers-card-elm">
                    <div className="products-thq-accent-bar-elm13"></div>
                    <div className="products-thq-card-body-elm12">
                      <span className="products-thq-title-elm12">
                        Alternate Suppliers
                      </span>
                      <span className="products-thq-desc-elm12">
                        Scans global supplier markets using trade data and
                        supplier databases to identify qualified alternate
                        sources — complete with risk profiles, landed cost
                        comparisons, and technical compatibility assessments.
                      </span>
                      <span className="products-thq-inputs-label-elm13">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm12">
                        <span className="products-text152">
                          Current supplier base
                        </span>
                        <span className="products-text153">Trade data</span>
                        <span className="products-text154">Category specs</span>
                      </div>
                      <div className="products-thq-divider-elm13"></div>
                      <div className="products-thq-cpo-row-elm12">
                        <span className="products-text155"> </span>
                        <span className="products-text156">
                          CPO: Reduces single-source risk — qualified
                          alternatives always on hand
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm12">
                        <span className="products-text157"> </span>
                        <span className="products-text158">
                          CFO: Creates competitive tension — lowers price even
                          if you don&apos;t switch
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm12">
                      <span className="products-text159">Explore →</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeCategory === 2 && (
              <div className="products-thq-panel2-margin-protction-elm">
                <div className="products-thq-should-cost-modeling-hero-card-elm">
                  <div className="products-thq-left-column-elm2">
                    <div className="products-thq-accent-bar-elm14"></div>
                    <div className="products-thq-left-column-inner-elm2">
                      <span className="products-thq-hero-badge-elm2">
                        Hero Agent
                      </span>
                      <span className="products-thq-agent-title-elm2">
                        Should-Cost Modeling
                      </span>
                      <span className="products-thq-description-elm2">
                        Apollo builds bottom-up clean sheet cost models for
                        every direct material — breaking down raw material,
                        labour, energy, and overhead components so you know
                        exactly what a product should cost before you negotiate.
                      </span>
                      <span className="products-thq-inputs-label-elm14">
                        INPUTS NEEDED
                      </span>
                      <div className="products-thq-input-tags-row-elm2">
                        <span className="products-text160">Material specs</span>
                        <span className="products-text161">
                          Commodity indices
                        </span>
                        <span className="products-text162">
                          Manufacturing data
                        </span>
                        <span className="products-text163">
                          Supplier financials
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="products-thq-right-column-elm2">
                    <div className="products-thq-cpo-outcomes-block-elm2">
                      <span className="products-text164">👤 CPO Outcomes</span>
                      <div className="products-thq-bullet-point1-elm3">
                        <span className="products-text165"> </span>
                        <span className="products-text166">
                          Negotiators walk in knowing the should-cost — not just
                          the last price paid
                        </span>
                      </div>
                      <div className="products-thq-bullet-point2-elm3">
                        <span className="products-text167"> </span>
                        <span className="products-text168">
                          Supplier margin visibility prevents being taken
                          advantage of in renewals
                        </span>
                      </div>
                      <div className="products-thq-bullet-point3-elm3">
                        <span className="products-text169"> </span>
                        <span className="products-text170">
                          Models update automatically as commodity prices shift
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-divider-elm14"></div>
                    <div className="products-thq-cfo-outcomes-block-elm2">
                      <span className="products-text171">💼 CFO Outcomes</span>
                      <div className="products-thq-bullet-point1-elm4">
                        <span className="products-text172"> </span>
                        <span className="products-text173">
                          Prevents margin erosion from supplier price increases
                          not justified by costs
                        </span>
                      </div>
                      <div className="products-thq-bullet-point2-elm4">
                        <span className="products-text174"> </span>
                        <span className="products-text175">
                          Typical saving: 4–6% vs. market price on first
                          negotiation using should-cost
                        </span>
                      </div>
                      <div className="products-thq-bullet-point3-elm4">
                        <span className="products-text176"> </span>
                        <span className="products-text177">
                          Cost models feed directly into product pricing and
                          budget forecasting
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="products-thq-supporting-cards-row-elm2">
                  <div className="products-thq-price-forecasting-card-elm">
                    <div className="products-thq-accent-bar-elm15"></div>
                    <div className="products-thq-card-body-elm13">
                      <span className="products-thq-title-elm13">
                        Price Forecasting
                      </span>
                      <span className="products-thq-desc-elm13">
                        Predicts commodity and raw material price movements
                        using market signals, macro indicators, and historical
                        patterns — giving your team a forward view to plan
                        hedging and contracting decisions.
                      </span>
                      <span className="products-thq-inputs-label-elm15">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm13">
                        <span className="products-text178">Market indices</span>
                        <span className="products-text179">Macro data</span>
                        <span className="products-text180">
                          Historical prices
                        </span>
                      </div>
                      <div className="products-thq-divider-elm15"></div>
                      <div className="products-thq-cpo-row-elm13">
                        <span className="products-text181"> </span>
                        <span className="products-text182">
                          CPO: Plan contract timing — lock in when market is in
                          your favour
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm13">
                        <span className="products-text183"> </span>
                        <span className="products-text184">
                          CFO: Reduces commodity cost variance — more accurate
                          budget forecasting
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm13">
                      <span className="products-text185">Explore →</span>
                    </div>
                  </div>
                  <div className="products-thq-sustainability-tracking-card-elm">
                    <div className="products-thq-accent-bar-elm16"></div>
                    <div className="products-thq-card-body-elm14">
                      <span className="products-thq-title-elm14">
                        Sustainability Tracking
                      </span>
                      <span className="products-thq-desc-elm14">
                        Monitors your supply base for ESG compliance, carbon
                        footprint, and regulatory risk — surfacing suppliers
                        that create exposure before they become a headline or a
                        fine.
                      </span>
                      <span className="products-thq-inputs-label-elm16">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm14">
                        <span className="products-text186">Supplier data</span>
                        <span className="products-text187">ESG databases</span>
                        <span className="products-text188">
                          Regulatory feeds
                        </span>
                      </div>
                      <div className="products-thq-divider-elm16"></div>
                      <div className="products-thq-cpo-row-elm14">
                        <span className="products-text189"> </span>
                        <span className="products-text190">
                          CPO: ESG compliance becomes proactive, not reactive
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm14">
                        <span className="products-text191"> </span>
                        <span className="products-text192">
                          CFO: Reduces regulatory risk and potential supply
                          disruption costs
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm14">
                      <span className="products-text193">Explore →</span>
                    </div>
                  </div>
                  <div className="products-thq-resilience-sentinel-card-elm">
                    <div className="products-thq-accent-bar-elm17"></div>
                    <div className="products-thq-card-body-elm15">
                      <span className="products-thq-title-elm15">
                        Resilience Sentinel
                      </span>
                      <span className="products-thq-desc-elm15">
                        Monitors your supplier base and supply chain for risk
                        signals — geopolitical events, financial distress,
                        logistics disruptions — and alerts your team before they
                        become a production problem.
                      </span>
                      <span className="products-thq-inputs-label-elm17">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm15">
                        <span className="products-text194">
                          Supplier financials
                        </span>
                        <span className="products-text195">News feeds</span>
                        <span className="products-text196">Logistics data</span>
                      </div>
                      <div className="products-thq-divider-elm17"></div>
                      <div className="products-thq-cpo-row-elm15">
                        <span className="products-text197"> </span>
                        <span className="products-text198">
                          CPO: Supply continuity protected — risks surface weeks
                          before they hit
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm15">
                        <span className="products-text199"> </span>
                        <span className="products-text200">
                          CFO: Avoids costly emergency sourcing and production
                          line stoppages
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm15">
                      <span className="products-text201">Explore →</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeCategory === 3 && (
              <div className="products-thq-panel3-productiity-elm">
                <div className="products-thq-negotiation-assistant-hero-card-elm">
                  <div className="products-thq-left-column-elm3">
                    <div className="products-thq-accent-bar-elm18"></div>
                    <div className="products-thq-left-column-inner-elm3">
                      <span className="products-thq-hero-badge-elm3">
                        Hero Agent
                      </span>
                      <span className="products-thq-agent-title-elm3">
                        Negotiation Assistant
                      </span>
                      <span className="products-thq-description-elm3">
                        Prepares your buyers for every negotiation — generating
                        market intelligence briefs, should-cost benchmarks,
                        supplier risk profiles, and negotiation playbooks
                        automatically before every supplier meeting.
                      </span>
                      <span className="products-thq-inputs-label-elm18">
                        INPUTS NEEDED
                      </span>
                      <div className="products-thq-input-tags-row-elm3">
                        <span className="products-text202">
                          Supplier history
                        </span>
                        <span className="products-text203">Contract data</span>
                        <span className="products-text204">
                          Market benchmarks
                        </span>
                        <span className="products-text205">
                          Category context
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="products-thq-right-column-elm3">
                    <div className="products-thq-cpo-outcomes-block-elm3">
                      <span className="products-text206">👤 CPO Outcomes</span>
                      <div className="products-thq-bullet-point1-elm5">
                        <span className="products-text207"> </span>
                        <span className="products-text208">
                          Every buyer walks in 3× better prepared — regardless
                          of experience level
                        </span>
                      </div>
                      <div className="products-thq-bullet-point2-elm5">
                        <span className="products-text209"> </span>
                        <span className="products-text210">
                          Preparation time reduced from days to minutes
                        </span>
                      </div>
                      <div className="products-thq-bullet-point3-elm5">
                        <span className="products-text211"> </span>
                        <span className="products-text212">
                          Negotiation outcomes tracked and fed back to improve
                          future playbooks
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-divider-elm18"></div>
                    <div className="products-thq-cfo-outcomes-block-elm3">
                      <span className="products-text213">💼 CFO Outcomes</span>
                      <div className="products-thq-bullet-point1-elm6">
                        <span className="products-text214"> </span>
                        <span className="products-text215">
                          Better negotiations = better contracts = sustained
                          margin protection
                        </span>
                      </div>
                      <div className="products-thq-bullet-point2-elm6">
                        <span className="products-text216"> </span>
                        <span className="products-text217">
                          Procurement team capacity freed for higher-value
                          strategic work
                        </span>
                      </div>
                      <div className="products-thq-bullet-point3-elm6">
                        <span className="products-text218"> </span>
                        <span className="products-text219">
                          Reduces dependency on senior buyer knowledge —
                          scalable across the team
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="products-thq-supporting-cards-row-elm3">
                  <div className="products-thq-automated-quote-card-elm">
                    <div className="products-thq-accent-bar-elm19"></div>
                    <div className="products-thq-card-body-elm16">
                      <span className="products-thq-title-elm16">
                        Automated Quote Initiation &amp; Selection
                      </span>
                      <span className="products-thq-desc-elm16">
                        <span>
                          Initiates RFQs automatically based on triggers —
                          contract expiry, price thresholds, new demand signals
                          — and scores incoming quotes against should-cost and
                          supplier risk criteria.
                        </span>
                        <br></br>
                      </span>
                      <span className="products-thq-inputs-label-elm19">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm16">
                        <span className="products-text222">MRP Output</span>
                        <span className="products-text223">Spend History</span>
                        <span className="products-text224">Supplier list</span>
                      </div>
                      <div className="products-thq-divider-elm19"></div>
                      <div className="products-thq-cpo-row-elm16">
                        <span className="products-text225"> </span>
                        <span className="products-text226">
                          CPO: No material gets missed — RFQs go out before
                          contracts auto-renew or safety stocks are consumed
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm16">
                        <span className="products-text227"> </span>
                        <span className="products-text228">
                          CFO: Competitive tension maintained on all spend — not
                          just priority categories
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm16">
                      <span className="products-text229">Explore →</span>
                    </div>
                  </div>
                  <div className="products-thq-sipplier-relationship-card-elm">
                    <div className="products-thq-accent-bar-elm20"></div>
                    <div className="products-thq-card-body-elm17">
                      <span className="products-thq-title-elm17">
                        Supplier Relationship Manager
                      </span>
                      <span className="products-thq-desc-elm17">
                        Tracks supplier performance, joint development projects,
                        communication history, and relationship health — giving
                        buyers a single view of every supplier relationship and
                        surfacing issues before they affect supply continuity.
                      </span>
                      <span className="products-thq-inputs-label-elm20">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm17">
                        <span className="products-text230">Delivery data</span>
                        <span className="products-text231">
                          Communication logs
                        </span>
                        <span className="products-text232">MRP Output</span>
                      </div>
                      <div className="products-thq-divider-elm20"></div>
                      <div className="products-thq-cpo-row-elm17">
                        <span className="products-text233"> </span>
                        <span className="products-text234">
                          CPO: Supplier performance managed proactively, not
                          reactively
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm17">
                        <span className="products-text235"> </span>
                        <span className="products-text236">
                          CFO: Tracks joint development projects and outcomes.
                          Reduces cost of poor supplier performance
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm17">
                      <span className="products-text237">Explore →</span>
                    </div>
                  </div>
                  <div className="products-thq-market-demand-supply-card-elm">
                    <div className="products-thq-accent-bar-elm21"></div>
                    <div className="products-thq-card-body-elm18">
                      <span className="products-thq-title-elm18">
                        Market Demand &amp; Supply Tracker
                      </span>
                      <span className="products-thq-desc-elm18">
                        Monitors demand and supply dynamics across your key
                        categories — alerting buyers to supply tightness, demand
                        surges, or market imbalances that affect your purchasing
                        power and timing.
                      </span>
                      <span className="products-thq-inputs-label-elm21">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm18">
                        <span className="products-text238">Market data</span>
                        <span className="products-text239">
                          Industry reports
                        </span>
                        <span className="products-text240">Demand signals</span>
                      </div>
                      <div className="products-thq-divider-elm21"></div>
                      <div className="products-thq-cpo-row-elm18">
                        <span className="products-text241"> </span>
                        <span className="products-text242">
                          CPO: Buyers act on market intelligence, not gut feel
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm18">
                        <span className="products-text243"> </span>
                        <span className="products-text244">
                          CFO: Buying decisions timed to market conditions —
                          reduces overpaying
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm18">
                      <span className="products-text245">Explore →</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeCategory === 4 && (
              <div className="products-thq-panel4-data-analytics-elm">
                <div className="products-thq-data-de-duplication-hero-card-elm">
                  <div className="products-thq-left-column-elm4">
                    <div className="products-thq-accent-bar-elm22"></div>
                    <div className="products-thq-left-column-inner-elm4">
                      <span className="products-thq-hero-badge-elm4">
                        Hero Agent
                      </span>
                      <span className="products-thq-agent-title-elm4">
                        Data De-duplication
                      </span>
                      <span className="products-thq-description-elm4">
                        Uses AI to identify and resolve duplicate material and
                        vendor records across your ERP — creating clean,
                        consolidated master data that every other Apollo agent
                        depends on to operate accurately.
                      </span>
                      <span className="products-thq-inputs-label-elm22">
                        INPUTS NEEDED
                      </span>
                      <div className="products-thq-input-tags-row-elm4">
                        <span className="products-text246">
                          Material master
                        </span>
                        <span className="products-text247">Vendor master</span>
                        <span className="products-text248">User Inputs</span>
                      </div>
                    </div>
                  </div>
                  <div className="products-thq-right-column-elm4">
                    <div className="products-thq-cpo-outcomes-block-elm4">
                      <span className="products-text249">👤 CPO Outcomes</span>
                      <div className="products-thq-bullet-point1-elm7">
                        <span className="products-text250"> </span>
                        <span className="products-text251">
                          Procurement decisions based on accurate, consolidated
                          spend data — not fragmented records
                        </span>
                      </div>
                      <div className="products-thq-bullet-point2-elm7">
                        <span className="products-text252"> </span>
                        <span className="products-text253">
                          Eliminates the hours spent by buyers reconciling
                          duplicate records manually
                        </span>
                      </div>
                      <div className="products-thq-bullet-point3-elm7">
                        <span className="products-text254"> </span>
                        <span className="products-text255">
                          Foundation for all Apollo agents — clean data means
                          better recommendations
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-divider-elm22"></div>
                    <div className="products-thq-cfo-outcomes-block-elm4">
                      <span className="products-text256">💼 CFO Outcomes</span>
                      <div className="products-thq-bullet-point1-elm8">
                        <span className="products-text257"> </span>
                        <span className="products-text258">
                          True spend visibility — no hidden maverick buying
                          obscured by duplicates
                        </span>
                      </div>
                      <div className="products-thq-bullet-point2-elm8">
                        <span className="products-text259"> </span>
                        <span className="products-text260">
                          Accurate supplier consolidation opportunities surface
                          — reduces supply base complexity
                        </span>
                      </div>
                      <div className="products-thq-bullet-point3-elm8">
                        <span className="products-text261"> </span>
                        <span className="products-text262">
                          Audit-ready data across all direct spend categories
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="products-thq-supporting-cards-row-elm4">
                  <div className="products-thq-data-enrichment-golden-records-card-elm">
                    <div className="products-thq-accent-bar-elm23"></div>
                    <div className="products-thq-card-body-elm19">
                      <span className="products-thq-title-elm19">
                        Data Enrichment &amp; Golden Records
                      </span>
                      <span className="products-thq-desc-elm19">
                        Enriches thin or inconsistent material descriptions with
                        structured, standardised attributes and consolidates
                        vendor data into single authoritative Golden Records —
                        making your master data AI-interpretable.
                      </span>
                      <span className="products-thq-inputs-label-elm23">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm19">
                        <span className="products-text263">
                          Material master
                        </span>
                        <span className="products-text264">Vendor master</span>
                        <span className="products-text265">
                          External databases
                        </span>
                      </div>
                      <div className="products-thq-divider-elm23"></div>
                      <div className="products-thq-cpo-row-elm19">
                        <span className="products-text266"> </span>
                        <span className="products-text267">
                          CPO: Buyers can find and compare materials instantly —
                          no more guesswork
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm19">
                        <span className="products-text268"> </span>
                        <span className="products-text269">
                          CFO: Better data = better AI = better procurement
                          outcomes across the board
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm19">
                      <span className="products-text270">Explore →</span>
                    </div>
                  </div>
                  <div className="products-thq-data-management-in-ma-card-elm">
                    <div className="products-thq-accent-bar-elm24"></div>
                    <div className="products-thq-card-body-elm20">
                      <span className="products-thq-title-elm20">
                        Data Management in M&amp;A
                      </span>
                      <span className="products-thq-desc-elm20">
                        In mergers and acquisitions, rapidly simulates unified
                        material and supplier master data — identifying
                        overlaps, consolidation opportunities, and cost
                        synergies before Day 1 integration begins.
                      </span>
                      <span className="products-thq-inputs-label-elm24">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm20">
                        <span className="products-text271">
                          Both entity ERPs
                        </span>
                        <span className="products-text272">Spend data</span>
                        <span className="products-text273">Supplier lists</span>
                      </div>
                      <div className="products-thq-divider-elm24"></div>
                      <div className="products-thq-cpo-row-elm20">
                        <span className="products-text274"> </span>
                        <span className="products-text275">
                          CPO: Procurement integration roadmap built on data,
                          not assumptions
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm20">
                        <span className="products-text276"> </span>
                        <span className="products-text277">
                          CFO: Procurement synergies quantified and actioned
                          faster — accelerates M&amp;A ROI
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm20">
                      <span className="products-text278">Explore →</span>
                    </div>
                  </div>
                  <div className="products-thq-analytics-card-elm">
                    <div className="products-thq-accent-bar-elm25"></div>
                    <div className="products-thq-card-body-elm21">
                      <span className="products-thq-title-elm21">
                        Analytics
                      </span>
                      <span className="products-thq-desc-elm21">
                        Turns raw procurement data into decision-ready
                        intelligence — spend dashboards, price benchmarking,
                        inventory levels, EBITDA contribution by procurement
                        team tracking - analytics give leadership a live view of
                        procurement performance.
                      </span>
                      <span className="products-thq-inputs-label-elm25">
                        INPUTS
                      </span>
                      <div className="products-thq-tags-tow-elm21">
                        <span className="products-text279">ERP data</span>
                        <span className="products-text280">Contract data</span>
                        <span className="products-text281">
                          Communication Logs
                        </span>
                      </div>
                      <div className="products-thq-divider-elm25"></div>
                      <div className="products-thq-cpo-row-elm21">
                        <span className="products-text282"> </span>
                        <span className="products-text283">
                          CPO: Real-time view of team performance and category
                          health
                        </span>
                      </div>
                      <div className="products-thq-cfo-row-elm21">
                        <span className="products-text284"> </span>
                        <span className="products-text285">
                          CFO: Savings verified, tracked, and reported — not
                          just claimed
                        </span>
                      </div>
                    </div>
                    <div className="products-thq-card-footer-elm21">
                      <span className="products-text286">Explore →</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="products-thq-security-section-elm">
        <div className="products-thq-security-subsection-row-elm">
          <div className="products-thq-security-left-column-elm">
            <div className="products-thq-eyebrow-row-elm1">
              <div className="products-thq-line-elm1"></div>
              <span className="products-thq-eyebrow-text-elm">
                Information Security
              </span>
            </div>
            <div className="products-thq-title-row-elm">
              <span className="products-thq-line1-elm1">Your data stays</span>
              <span className="products-thq-line2-elm1">in your world.</span>
            </div>
            <div className="products-thq-sub-title-row-elm">
              <span className="products-text287">
                Enterprise procurement data is among the most commercially
                sensitive information a company holds. Apollo is built on a
                non-negotiable principle: your data never leaves your
                environment.
              </span>
            </div>
            <div className="products-thq-security-points-elm">
              <div className="products-thq-point1-row-elm">
                <div className="products-thq-icon-box-elm1">
                  <span>🔒</span>
                </div>
                <div className="products-thq-text-column-elm1">
                  <span className="products-thq-title-elm22">
                    Data never leaves your environment
                    <span
                      dangerouslySetInnerHTML={{
                        __html: ' ',
                      }}
                    />
                  </span>
                  <span className="products-thq-desc-elm22">
                    Apollo runs inside your own infrastructure — on-premise or
                    your private cloud. No data is sent to external servers, no
                    spend data is shared, and no models are trained on your
                    information.
                  </span>
                </div>
              </div>
              <div className="products-thq-point2-row-elm">
                <div className="products-thq-icon-box-elm2">
                  <span>🏗️</span>
                </div>
                <div className="products-thq-text-column-elm2">
                  <span className="products-thq-title-elm23">
                    Works alongside your existing stack
                    <span
                      dangerouslySetInnerHTML={{
                        __html: ' ',
                      }}
                    />
                  </span>
                  <span className="products-thq-desc-elm23">
                    Apollo ingests data from ERPs (SAP / ORACLE etc) and
                    Procurement software (Ariba / Coupa etc) without replacing
                    them. It connects via secure APIs — no data migration, no
                    rip-and-replace, no disruption to existing workflows.
                  </span>
                </div>
              </div>
              <div className="products-thq-point3-row-elm">
                <div className="products-thq-icon-box-elm3">
                  <span>⚙️</span>
                </div>
                <div className="products-thq-text-column-elm3">
                  <span className="products-thq-title-elm24">
                    Role-based access and audit trails
                  </span>
                  <span className="products-thq-desc-elm24">
                    Every Apollo action is logged and attributable. Access is
                    controlled by role — buyers see their categories, leadership
                    sees the full picture, and IT sees everything in the audit
                    trail.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="products-thq-security-right-column-elm">
            <div className="products-thq-card-header-elm">
              <span className="products-thq-title-elm25">
                Live in 60–90 days
              </span>
              <span className="products-thq-desc-elm25">
                Apollo connects to your existing ERP and procurement systems —
                no migration, no rebuilding processes. Our Forward Deployed
                Engineers handle configuration so your team stays focused on
                procurement.
              </span>
            </div>
            <div className="products-thq-stat-row1-elm">
              <span className="products-thq-number-elm1">60-90</span>
              <div className="products-container4">
                <span className="products-thq-bold-label-elm1">
                  Days to go live
                </span>
                <span className="products-thq-sub-label-elm1">
                  from contract signing to first agent running
                </span>
              </div>
            </div>
            <div className="products-thq-stat-row2-elm1">
              <span className="products-thq-number-elm2">0</span>
              <div className="products-container5">
                <span className="products-thq-bold-label-elm2">
                  Data leaves your environment
                </span>
                <span className="products-thq-sub-label-elm2">
                  Apollo runs where your data lives
                </span>
              </div>
            </div>
            <div className="products-thq-stat-row2-elm2">
              <span className="products-thq-number-elm3">16</span>
              <div className="products-container6">
                <span className="products-thq-bold-label-elm3">
                  Agents working for you
                </span>
                <span className="products-thq-sub-label-elm3">
                  across every direct procurement lever
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="products-thq-comparison-section-elm">
        <div className="products-thq-comparison-inner-elm">
          <div className="products-thq-eyebrow-row-elm2">
            <div className="products-thq-line-elm2"></div>
            <span className="products-text291">How Apollo is Different</span>
          </div>
          <div className="products-thq-title-elm26">
            <span className="products-text292">Not a replacement.</span>
            <span className="products-text293">An unfair advantage.</span>
          </div>
          <span className="products-thq-subtitle-elm1">
            ERP (SAP / ORACLE etc) and Procurement software (Ariba / Coupa etc)
            manage your procurement process. Apollo creates the intelligence
            that makes every decision in that process smarter.
          </span>
        </div>
        <div className="products-container7">
          <div className="products-container8">
            <Script
              html={`<div style="width:100%;overflow:auto;">
  <table style="width:100%;border-collapse:collapse;border:1px solid #E8ECF4;border-radius:14px;overflow:hidden;">
    <thead>
      <tr>
        <th
          style="padding:18px 28px;text-align:left;font-size:.72rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;background:#F4F6FA;color:#7A8AAE;border-bottom:1px solid #E8ECF4;border-right:1px solid #E8ECF4;font-family:'DM Sans',sans-serif;">
          Capability</th>
        <th
          style="padding:18px 28px;text-align:left;font-size:.72rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;background:#E8ECF4;color:#4A5880;border-bottom:1px solid #E8ECF4;border-right:1px solid #E8ECF4;font-family:'DM Sans',sans-serif;">
          SAP / Coupa</th>
        <th
          style="padding:18px 28px;text-align:left;font-size:.72rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;background:#C9933A;color:#fff;border-bottom:1px solid #E8ECF4;font-family:'DM Sans',sans-serif;">
          Apollo</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid #E8ECF4;">
        <td
          style="padding:16px 28px;font-size:.82rem;font-weight:500;color:#253050;border-right:1px solid #E8ECF4;background:#F4F6FA;font-family:'DM Sans',sans-serif;">
          Market intelligence for negotiations</td>
        <td
          style="padding:16px 28px;font-size:.82rem;color:#7A8AAE;border-right:1px solid #E8ECF4;font-family:'DM Sans',sans-serif;">
          ✗ Not included</td>
        <td style="padding:16px 28px;font-size:.82rem;color:#0F1421;font-family:'DM Sans',sans-serif;">✓ Generated
          automatically per supplier meeting</td>
      </tr>
      <tr style="border-bottom:1px solid #E8ECF4;">
        <td
          style="padding:16px 28px;font-size:.82rem;font-weight:500;color:#253050;border-right:1px solid #E8ECF4;background:#F4F6FA;font-family:'DM Sans',sans-serif;">
          Should-cost modeling</td>
        <td
          style="padding:16px 28px;font-size:.82rem;color:#7A8AAE;border-right:1px solid #E8ECF4;font-family:'DM Sans',sans-serif;">
          ✗ Manual, if at all</td>
        <td style="padding:16px 28px;font-size:.82rem;color:#0F1421;font-family:'DM Sans',sans-serif;">✓ Bottom-up model
          for every material, updated continuously</td>
      </tr>
      <tr style="border-bottom:1px solid #E8ECF4;">
        <td
          style="padding:16px 28px;font-size:.82rem;font-weight:500;color:#253050;border-right:1px solid #E8ECF4;background:#F4F6FA;font-family:'DM Sans',sans-serif;">
          Commodity price forecasting</td>
        <td
          style="padding:16px 28px;font-size:.82rem;color:#7A8AAE;border-right:1px solid #E8ECF4;font-family:'DM Sans',sans-serif;">
          ✗ Requires external tools</td>
        <td style="padding:16px 28px;font-size:.82rem;color:#0F1421;font-family:'DM Sans',sans-serif;">✓ Built in —
          feeds directly into buying decisions</td>
      </tr>
      <tr style="border-bottom:1px solid #E8ECF4;">
        <td
          style="padding:16px 28px;font-size:.82rem;font-weight:500;color:#253050;border-right:1px solid #E8ECF4;background:#F4F6FA;font-family:'DM Sans',sans-serif;">
          Alternate supplier discovery</td>
        <td
          style="padding:16px 28px;font-size:.82rem;color:#7A8AAE;border-right:1px solid #E8ECF4;font-family:'DM Sans',sans-serif;">
          ✗ Manual supplier search</td>
        <td style="padding:16px 28px;font-size:.82rem;color:#0F1421;font-family:'DM Sans',sans-serif;">✓ Continuous scan
          of global supplier markets</td>
      </tr>
      <tr style="border-bottom:1px solid #E8ECF4;">
        <td
          style="padding:16px 28px;font-size:.82rem;font-weight:500;color:#253050;border-right:1px solid #E8ECF4;background:#F4F6FA;font-family:'DM Sans',sans-serif;">
          Data stays in your environment</td>
        <td
          style="padding:16px 28px;font-size:.82rem;color:#253050;border-right:1px solid #E8ECF4;font-family:'DM Sans',sans-serif;">
          ~ Varies by deployment</td>
        <td style="padding:16px 28px;font-size:.82rem;color:#0F1421;font-family:'DM Sans',sans-serif;">✓ Always — by
          design</td>
      </tr>
      <tr>
        <td
          style="padding:16px 28px;font-size:.82rem;font-weight:500;color:#253050;border-right:1px solid #E8ECF4;background:#F4F6FA;font-family:'DM Sans',sans-serif;">
          Time to value</td>
        <td
          style="padding:16px 28px;font-size:.82rem;color:#7A8AAE;border-right:1px solid #E8ECF4;font-family:'DM Sans',sans-serif;">
          12–24 months implementation</td>
        <td style="padding:16px 28px;font-size:.82rem;color:#0F1421;font-family:'DM Sans',sans-serif;">✓ 60–90 days to
          first agent running</td>
      </tr>
    </tbody>
  </table>
</div>`}
            ></Script>
          </div>
        </div>
      </div>
      <div className="products-thq-cta-strip-elm">
        <div className="products-thq-cta-inner-elm">
          <div className="products-thq-left-column-elm5">
            <div className="products-thq-title-elm27">
              <span className="products-thq-line1-elm2">
                Ready to see Apollo
              </span>
              <span className="products-thq-line2-elm2">on your spend?</span>
            </div>
            <span className="products-thq-subtitle-elm2">
              30 minutes. Your spend data. Our team. No slides.
            </span>
          </div>
          <div className="products-thq-right-column-elm5">
            <div className="products-thq-buttons-row-elm">
              <GostTealButton
                rootClassName="gost-teal-buttonroot-class-name5"
                gostTealButton={
                  <Fragment>
                    <span className="products-text294">
                      download agent overview
                    </span>
                  </Fragment>
                }
              ></GostTealButton>
              <PrimaryButton
                rootClassName="primary-buttonroot-class-name6"
                primaryButtonTest={
                  <Fragment>
                    <span className="products-text295">REQUEST DEMO</span>
                  </Fragment>
                }
              ></PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products
