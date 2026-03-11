import React, { useState, Fragment } from 'react'

import PropTypes from 'prop-types'

import CardWrapperBrass1 from './card-wrapper-brass1'
import CardWrapperSlate from './card-wrapper-slate'
import CardWrapperTeal from './card-wrapper-teal'
import './agent-list1.css'

const AgentList1 = (props) => {
  const [activeTab, setActiveTab] = useState(1)
  return (
    <div className="agent-list1-thq-agent-list1-elm">
      <div className="agent-list1-thq-agent-group-list-elm">
        <span className="agent-list1-thq-eye-brow-elm1">
          {props.eyeBrow3 ?? (
            <Fragment>
              <span className="agent-list1-text202">AGENT CATEGORIES</span>
            </Fragment>
          )}
        </span>
        <div className="agent-list1-thq-tab1-wrapper-elm">
          {activeTab !== 1 && (
            <div
              onClick={() => setActiveTab(1)}
              className="agent-list1-thq-agent-group-name1-inactive-elm"
            >
              <span className="agent-list1-thq-text-elm">
                {props.text ?? (
                  <Fragment>
                    <span className="agent-list1-text195">
                      Margin Expansion
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
          {activeTab === 1 && (
            <div
              onClick={() => setActiveTab(1)}
              className="agent-list1-thq-agent-group-name1-active-elm"
            >
              <span className="agent-list1-text100">
                {props.text4 ?? (
                  <Fragment>
                    <span className="agent-list1-text211">
                      Margin Expansion
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
        </div>
        <div className="agent-list1-thq-tab2-wrapper-elm">
          {activeTab !== 2 && (
            <div
              onClick={() => setActiveTab(2)}
              className="agent-list1-thq-agent-group-name2-inactive-elm"
            >
              <span className="agent-list1-text101">
                {props.text1 ?? (
                  <Fragment>
                    <span className="agent-list1-text201">
                      Margin Protection
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
          {activeTab === 2 && (
            <div
              onClick={() => setActiveTab(2)}
              className="agent-list1-thq-agent-group-name2-active-elm"
            >
              <span className="agent-list1-text102">
                {props.text11 ?? (
                  <Fragment>
                    <span className="agent-list1-text210">
                      Margin Protection
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
        </div>
        <div className="agent-list1-thq-tab3-wrapper-elm">
          {activeTab !== 3 && (
            <div
              onClick={() => setActiveTab(3)}
              className="agent-list1-thq-agent-group-name3-inactive-elm"
            >
              <span className="agent-list1-text103">
                {props.text2 ?? (
                  <Fragment>
                    <span className="agent-list1-text215">
                      Productivity Improvement
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
          {activeTab === 3 && (
            <div
              onClick={() => setActiveTab(3)}
              className="agent-list1-thq-agent-group-name3-active-elm"
            >
              <span className="agent-list1-text104">
                {props.text21 ?? (
                  <Fragment>
                    <span className="agent-list1-text204">
                      Productivity Improvement
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
        </div>
        <div className="agent-list1-thq-tab4-wrapper-elm">
          {activeTab !== 4 && (
            <div
              onClick={() => setActiveTab(4)}
              className="agent-list1-thq-agent-group-name4-inactive-elm"
            >
              <span className="agent-list1-text105">
                {props.text3 ?? (
                  <Fragment>
                    <span className="agent-list1-text213">
                      Analytics &amp; Data Management
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
          {activeTab === 4 && (
            <div
              onClick={() => setActiveTab(4)}
              className="agent-list1-thq-agent-group-name4-active-elm"
            >
              <span className="agent-list1-text106">
                {props.text31 ?? (
                  <Fragment>
                    <span className="agent-list1-text199">
                      Analytics &amp; Data Management
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="agent-list1-thq-agent-group-feature-cards-list-elm">
        <div className="agent-list1-thq-cards-hearder-wrapper-elm">
          {activeTab === 1 && (
            <div className="agent-list1-thq-cards-header1-elm">
              <span className="agent-list1-thq-eye-brow-elm2">
                {props.eyeBrow ?? (
                  <Fragment>
                    <span className="agent-list1-text200">
                      MARGIN EXPANSION
                    </span>
                  </Fragment>
                )}
              </span>
              <span className="agent-list1-text107">
                {props.text5 ?? (
                  <Fragment>
                    <span className="agent-list1-text212">
                      Agents that grow your margin
                    </span>
                  </Fragment>
                )}
              </span>
              <span className="agent-list1-text108">
                {props.text6 ?? (
                  <Fragment>
                    <span className="agent-list1-text206">
                      Identify and capture untapped savings across your direct
                      spend.
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
          {activeTab === 2 && (
            <div className="agent-list1-thq-cards-header2-elm">
              <span className="agent-list1-thq-eye-brow-elm3">
                {props.eyeBrow2 ?? (
                  <Fragment>
                    <span className="agent-list1-text209">
                      MARGIN PROTECTION
                    </span>
                  </Fragment>
                )}
              </span>
              <span className="agent-list1-text109">
                {props.text51 ?? (
                  <Fragment>
                    <span className="agent-list1-text207">
                      Agents that defend your margin
                    </span>
                  </Fragment>
                )}
              </span>
              <span className="agent-list1-text110">
                {props.text61 ?? (
                  <Fragment>
                    <span className="agent-list1-text203">
                      Monitor risks, track compliance, and flag supplier issues
                      before they cost you.
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
          {activeTab === 3 && (
            <div className="agent-list1-thq-cards-header3-elm">
              <span className="agent-list1-thq-eye-brow-elm4">
                {props.eyeBrow21 ?? (
                  <Fragment>
                    <span className="agent-list1-text196">
                      PRODUCTIVITY IMPROVEMENT
                    </span>
                  </Fragment>
                )}
              </span>
              <span className="agent-list1-text111">
                {props.text511 ?? (
                  <Fragment>
                    <span className="agent-list1-text198">
                      Agents that accelerate your team
                    </span>
                  </Fragment>
                )}
              </span>
              <span className="agent-list1-text112">
                {props.text611 ?? (
                  <Fragment>
                    <span className="agent-list1-text208">
                      Automate repetitive work so your buyers focus on strategic
                      decisions.
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
          {activeTab === 4 && (
            <div className="agent-list1-thq-cards-header4-elm">
              <span className="agent-list1-thq-eye-brow-elm5">
                {props.eyeBrow211 ?? (
                  <Fragment>
                    <span className="agent-list1-text205">
                      ANALYTICS &amp; DATA MANAGEMENT
                    </span>
                  </Fragment>
                )}
              </span>
              <span className="agent-list1-text113">
                {props.text5111 ?? (
                  <Fragment>
                    <span className="agent-list1-text214">
                      Agents that sharpen your insights
                    </span>
                  </Fragment>
                )}
              </span>
              <span className="agent-list1-text114">
                {props.text6111 ?? (
                  <Fragment>
                    <span className="agent-list1-text197">
                      Turn raw procurement data into decision-ready
                      intelligence.
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          )}
        </div>
        {activeTab === 1 && (
          <div className="agent-list1-thq-agent-group-feature-card-list1-elm">
            <CardWrapperBrass1
              tag={
                <Fragment>
                  <span className="agent-list1-text115">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text116">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text117">Procurement Prism</span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text118">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text119">
                    Creates individual material strategies using granular market
                    intelligence for 100% of your direct spend — turning raw
                    category data into actionable negotiation levers for every
                    single line item, automatically.
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-brass1root-class-name"
            ></CardWrapperBrass1>
            <CardWrapperSlate
              tag={
                <Fragment>
                  <span className="agent-list1-text120">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text121">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text122">
                    Material Substitution
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text123">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text124">
                    Apollo analyses MRP output, initiates RFQs and compares
                    supplier responses — identifying lower-cost material
                    alternatives without compromising specification.
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-slateroot-class-name"
            ></CardWrapperSlate>
            <CardWrapperTeal
              tag={
                <Fragment>
                  <span className="agent-list1-text125">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text126">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text127">
                    Alternate Suppliers
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text128">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text129">
                    Scans global supplier markets, qualifies alternatives
                    against your category specifications, and surfaces
                    competitive options — complete with risk profiles and landed
                    cost comparisons.
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-tealroot-class-name"
            ></CardWrapperTeal>
            <CardWrapperBrass1
              tag={
                <Fragment>
                  <span className="agent-list1-text130">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text131">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text132">
                    Buy More Now or Later
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text133">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text134">
                    Exploits the &quot;Velocity Gap&quot; between market signals
                    and supplier price updates — telling your buyers exactly
                    when to accelerate purchases and when to hold, before the
                    market moves against you.
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-brass1root-class-name1"
            ></CardWrapperBrass1>
          </div>
        )}
        {activeTab === 2 && (
          <div className="agent-list1-thq-agent-group-feature-card-list2-elm">
            <CardWrapperBrass1
              tag={
                <Fragment>
                  <span className="agent-list1-text135">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text136">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text137">
                    Should-cost Modelling
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text138">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text139">
                    Automate the should cost modelling for 100% of the
                    materials.
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-brass1root-class-name2"
            ></CardWrapperBrass1>
            <CardWrapperSlate
              tag={
                <Fragment>
                  <span className="agent-list1-text140">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text141">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text142">Price Forecasting</span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text143">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text144">
                    Auditable price forecasts using commodity wise machine
                    learning models . Used both in negotiations and also in
                    budgeting for hedging.
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-slateroot-class-name1"
            ></CardWrapperSlate>
            <CardWrapperTeal
              tag={
                <Fragment>
                  <span className="agent-list1-text145">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text146">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text147">
                    Sustainability Tracking
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text148">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text149">
                    Ensure supplier compliance to reporting. Take procurement
                    decisions balancing between cost and target achievement.
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-tealroot-class-name1"
            ></CardWrapperTeal>
            <CardWrapperBrass1
              tag={
                <Fragment>
                  <span className="agent-list1-text150">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text151">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text152">
                    Resilience Sentinel
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text153">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text154">
                    &quot;Always Ready&quot; monitoring. It watches global
                    tariffs, regulatory changes, and supplier financial health
                    every second of the day.
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-brass1root-class-name3"
            ></CardWrapperBrass1>
          </div>
        )}
        {activeTab === 3 && (
          <div className="agent-list1-thq-agent-group-feature-card-list3-elm">
            <CardWrapperBrass1
              tag={
                <Fragment>
                  <span className="agent-list1-text155">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text156">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text157">
                    Negotiation Assistant
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text158">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text159">
                    Be ready for every negotiation with updated negotiation
                    templates. Be more prepared than the supplier about his
                    markets.
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-brass1root-class-name4"
            ></CardWrapperBrass1>
            <CardWrapperSlate
              tag={
                <Fragment>
                  <span className="agent-list1-text160">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text161">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text162">
                    Automated Quote Initiation &amp; Selection
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text163">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text164">
                    The AI agent uses MRP output, initiates RFQ and compares the
                    emails from suppliers or the uploads to Ariba
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-slateroot-class-name2"
            ></CardWrapperSlate>
            <CardWrapperTeal
              tag={
                <Fragment>
                  <span className="agent-list1-text165">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text166">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text167">
                    Supplier Relationship Manager
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text168">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text169">
                    Keeps track of Join Development projects, multiple point
                    engagements and action plans
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-tealroot-class-name2"
            ></CardWrapperTeal>
            <CardWrapperBrass1
              tag={
                <Fragment>
                  <span className="agent-list1-text170">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text171">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text172">
                    Market Demand &amp; Supply Tracker
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text173">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text174">
                    Automatically keep track of all approved suppliers planned
                    and potential shutdowns, geopolitical and commercial risks
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-brass1root-class-name5"
            ></CardWrapperBrass1>
          </div>
        )}
        {activeTab === 4 && (
          <div className="agent-list1-thq-agent-group-feature-card-list4-elm">
            <CardWrapperBrass1
              tag={
                <Fragment>
                  <span className="agent-list1-text175">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text176">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text177">
                    Data De-duplication
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text178">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text179">
                    Cleaning material and vendor master data using AI and ML
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-brass1root-class-name6"
            ></CardWrapperBrass1>
            <CardWrapperSlate
              tag={
                <Fragment>
                  <span className="agent-list1-text180">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text181">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text182">
                    Data Enrichment &amp; Golden Records
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text183">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text184">
                    Creates golden records by enriching master data and keeping
                    it updated.
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-slateroot-class-name3"
            ></CardWrapperSlate>
            <CardWrapperTeal
              tag={
                <Fragment>
                  <span className="agent-list1-text185">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text186">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text187">
                    Data Management in Mergers and Acquisitions
                  </span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text188">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text189">
                    In M&amp;A, doing quick simulations of unified material and
                    supplier master data.
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-tealroot-class-name3"
            ></CardWrapperTeal>
            <CardWrapperBrass1
              tag={
                <Fragment>
                  <span className="agent-list1-text190">AQS Agent</span>
                </Fragment>
              }
              link={
                <Fragment>
                  <span className="agent-list1-text191">Explore-&gt;</span>
                </Fragment>
              }
              title={
                <Fragment>
                  <span className="agent-list1-text192">Analytics</span>
                </Fragment>
              }
              eyeBrow={
                <Fragment>
                  <span className="agent-list1-text193">Operational AI</span>
                </Fragment>
              }
              bodyText={
                <Fragment>
                  <span className="agent-list1-text194">
                    Analytics including inventory, spend, cyclical
                    patterns, EBITDA contribution events
                  </span>
                </Fragment>
              }
              rootClassName="card-wrapper-brass1root-class-name7"
            ></CardWrapperBrass1>
          </div>
        )}
      </div>
    </div>
  )
}

AgentList1.defaultProps = {
  text: undefined,
  eyeBrow21: undefined,
  text6111: undefined,
  text511: undefined,
  text31: undefined,
  eyeBrow: undefined,
  text1: undefined,
  eyeBrow3: undefined,
  text61: undefined,
  text21: undefined,
  eyeBrow211: undefined,
  text6: undefined,
  text51: undefined,
  text611: undefined,
  eyeBrow2: undefined,
  text11: undefined,
  text4: undefined,
  text5: undefined,
  text3: undefined,
  text5111: undefined,
  text2: undefined,
}

AgentList1.propTypes = {
  text: PropTypes.element,
  eyeBrow21: PropTypes.element,
  text6111: PropTypes.element,
  text511: PropTypes.element,
  text31: PropTypes.element,
  eyeBrow: PropTypes.element,
  text1: PropTypes.element,
  eyeBrow3: PropTypes.element,
  text61: PropTypes.element,
  text21: PropTypes.element,
  eyeBrow211: PropTypes.element,
  text6: PropTypes.element,
  text51: PropTypes.element,
  text611: PropTypes.element,
  eyeBrow2: PropTypes.element,
  text11: PropTypes.element,
  text4: PropTypes.element,
  text5: PropTypes.element,
  text3: PropTypes.element,
  text5111: PropTypes.element,
  text2: PropTypes.element,
}

export default AgentList1
