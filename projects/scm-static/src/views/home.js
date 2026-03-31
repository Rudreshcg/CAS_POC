import React, { useState, Fragment } from 'react'

import Script from 'dangerous-html/react'
import { Helmet } from 'react-helmet'

import NavbarInteractive from '../components/navbar-interactive'
import PrimaryButton from '../components/primary-button'
import GostTealButton from '../components/gost-teal-button'
import AgentList1 from '../components/agent-list1'
import Footer from '../components/footer'
import CardWrapperBrass from '../components/card-wrapper-brass'
import SecondaryButton from '../components/secondary-button'
import CardWrapperTeal from '../components/card-wrapper-teal'
import CardWrapperSlate from '../components/card-wrapper-slate'
import CardWrapperBrass1 from '../components/card-wrapper-brass1'
import DemoModal from '../components/demo-modal'
import DownloadModal from '../components/download-modal'
import './home.css'

const Home = (props) => {
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  return (
    <div className="home-container1">
      <Helmet>
        <title>Practical Mean Cassowary</title>
        <meta property="og:title" content="Practical Mean Cassowary" />
        <link
          rel="canonical"
          href="https://practical-mean-cassowary-094j40.teleporthq.site/"
        />
        <meta
          property="og:url"
          content="https://practical-mean-cassowary-094j40.teleporthq.site/"
        />
      </Helmet>
      <NavbarInteractive
        home={
          <Fragment>
            <span className="home-text10">Home</span>
          </Fragment>
        }
        text={
          <Fragment>
            <span className="home-text11"> Apollo</span>
          </Fragment>
        }
        text3={
          <Fragment>
            <span className="home-text12">Home</span>
          </Fragment>
        }
        text4={
          <Fragment>
            <span className="home-text13">Products</span>
          </Fragment>
        }
        text5={
          <Fragment>
            <span className="home-text14">Services</span>
          </Fragment>
        }
        products={
          <Fragment>
            <span className="home-text15">Products</span>
          </Fragment>
        }
        register={
          <Fragment>
            <span className="home-text16">request Demo</span>
          </Fragment>
        }
        services={
          <Fragment>
            <span className="home-text17">Services</span>
          </Fragment>
        }
        text8={
          <Fragment>
            <span className="home-text18"> Apollo</span>
          </Fragment>
        }
        primaryButtonTest={
          <Fragment>
            <span className="home-text19">Request Demo</span>
          </Fragment>
        }
      ></NavbarInteractive>
      <div id="hero" className="home-thq-hero-section-elm">
        <div className="home-thq-background-grid-top-left-elm"></div>
        <div className="home-thq-brass-glow-top-right-elm"></div>
        <div className="home-thq-teal-glow-bottom-left-elm"></div>
        <div className="home-thq-left-column-elm">
          <div className="home-thq-eyebrow-row-elm">
            <div className="home-thq-teal-pulse-dot-elm"></div>
            <span className="home-text20">
              The future of procurement strategy
            </span>
          </div>
          <h1 className="home-text21">
            Scale your strategy, not just your headcount
          </h1>
          <span className="home-thq-sub-heading-elm">
            Deploy a 24/7 team of AI Agents that forecast markets, engineer
            costs, and provide the &quot;Always Ready&quot; intelligence your
            buyers need to win.
          </span>
          <div className="home-thq-buttons-row-elm">
            <PrimaryButton
              rootClassName="primary-buttonroot-class-name1"
              primaryButtonTest={
                <Fragment>
                  <span className="home-text22">Meet the agents</span>
                </Fragment>
              }
            ></PrimaryButton>
            <GostTealButton
              rootClassName="gost-teal-buttonroot-class-name"
              gostTealButton={
                <Fragment>
                  <span className="home-text23">Watch a 1 min Demo</span>
                </Fragment>
              }
              onClick={() => setShowDemoModal(true)}
            ></GostTealButton>
          </div>
          <div className="home-thq-trust-stats-row-elm">
            <div className="home-thq-stat-group1-elm">
              <span className="home-thq-number-elm1">73%</span>
              <span className="home-thq-label-elm1">
                Faster Procurement Cycles
              </span>
            </div>
            <div className="home-thq-divider1-elm"></div>
            <div className="home-thq-stat-group2-elm">
              <span className="home-thq-number-elm2">3-5%</span>
              <span className="home-thq-label-elm2">Margin Improvement</span>
            </div>
            <div className="home-thq-divider2-elm"></div>
            <div className="home-thq-stat-group3-elm">
              <span className="home-thq-number-elm3">24h</span>
              <span className="home-thq-label-elm3">
                Always-on INtelligence
              </span>
            </div>
          </div>
        </div>
        <div className="home-thq-right-column-elm">
          <div className="home-container2">
            <div className="home-container3">
              <Script
                html={`<style>
  .apollo-wrap {
    position: relative;
    width: 100%;
  }



  /* Main panel */
  .ap {
    background: rgba(26, 32, 53, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
    font-family: 'DM Sans', sans-serif;
  }

  .ap-bar {
    padding: 14px 20px;
    background: rgba(15, 20, 33, 0.9);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ap-dots {
    display: flex;
    gap: 6px;
  }

  .ap-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .ap-title {
    flex: 1;
    text-align: center;
    font-size: 0.7rem;
    color: #7A8AAE;
    letter-spacing: 0.04em;
  }

  .ap-live {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.65rem;
    color: #00D4BC;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .ap-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #00D4BC;
    box-shadow: 0 0 8px rgba(0, 212, 188, 0.8);
    animation: livePulse 1.5s ease-in-out infinite;
  }

  @keyframes livePulse {

    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }

  .ap-tabs {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding: 0 16px;
    overflow-x: auto;
  }

  .ap-tab {
    padding: 11px 13px;
    font-size: 0.68rem;
    font-weight: 400;
    color: #7A8AAE;
    cursor: pointer;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 200ms ease;
    letter-spacing: 0.02em;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: 'DM Sans', sans-serif;
  }

  .ap-tab.on {
    color: #fff;
    border-bottom-color: #D9A94E;
  }

  .ap-body {
    padding: 20px 20px 16px;
    min-height: 280px;
    position: relative;
  }

  .ap-card {
    display: none;
  }

  .ap-card.on {
    display: block;
    animation: cardIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
  }

  @keyframes cardIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ap-card-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .ap-name {
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .n-brass {
    color: #D9A94E;
  }

  .n-teal {
    color: #00D4BC;
  }

  .n-slate {
    color: #7A8AAE;
  }

  .ap-badge {
    font-size: 0.56rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 9999px;
    border: 1px solid;
  }

  .b-run {
    color: #00D4BC;
    border-color: rgba(0, 212, 188, 0.3);
    background: rgba(0, 212, 188, 0.08);
  }

  .b-done {
    color: #E8C278;
    border-color: rgba(201, 147, 58, 0.3);
    background: rgba(201, 147, 58, 0.08);
  }

  .b-alert {
    color: #F0A028;
    border-color: rgba(240, 160, 40, 0.3);
    background: rgba(240, 160, 40, 0.08);
  }

  .ap-lbl {
    font-size: 0.58rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #3A4870;
    margin-bottom: 8px;
  }

  .ap-out {
    background: rgba(10, 13, 20, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 13px;
    margin-bottom: 12px;
    font-family: 'Courier New', monospace;
    font-size: 0.76rem;
    line-height: 1.65;
    color: #C8D0E0;
  }

  .ot {
    color: #00D4BC;
  }

  .ob {
    color: #E8C278;
    font-style: italic;
  }

  .ow {
    color: #fff;
    font-weight: 700;
  }

  .owarn {
    color: #F0A028;
  }

  .ap-src {
    font-size: 0.63rem;
    color: #3A4870;
    line-height: 1.5;
  }

  .ap-src span {
    color: #7A8AAE;
  }

  .ap-mets {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .ap-met {
    flex: 1;
    padding: 9px 8px;
    border-radius: 8px;
    text-align: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .ap-mv {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 1.1rem;
    font-weight: 300;
    letter-spacing: -0.02em;
    color: #fff;
    line-height: 1;
    display: flex;
    align-items: baseline;
    justify-content: center;
  }

  .ap-mu {
    font-style: italic;
    color: #D9A94E;
  }

  .ap-ml {
    font-size: 0.56rem;
    color: #7A8AAE;
    margin-top: 3px;
  }

  .ap-dots-row {
    display: flex;
    gap: 6px;
    justify-content: center;
    padding: 10px 0 12px;
  }

  .ap-ind {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    transition: all 300ms ease;
    cursor: pointer;
    border: none;
    padding: 0;
  }

  .ap-ind.on {
    background: #D9A94E;
    width: 18px;
    border-radius: 3px;
  }

  .ap-ft {
    padding: 12px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(10, 13, 20, 0.3);
  }

  .ap-ft-l {
    font-size: 0.63rem;
    color: #3A4870;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .ap-ft-live {
    color: #00D4BC;
  }

  .ap-ft-btns {
    display: flex;
    gap: 7px;
  }

  .ap-ft-btn {
    padding: 5px 12px;
    border-radius: 4px;
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid;
    font-family: 'DM Sans', sans-serif;
    transition: all 150ms ease;
  }

  .ap-ft-gh {
    color: #7A8AAE;
    border-color: rgba(255, 255, 255, 0.1);
    background: transparent;
  }

  .ap-ft-gh:hover {
    color: #fff;
  }

  .ap-ft-br {
    color: #0A0D14;
    background: #C9933A;
    border-color: #C9933A;
  }

  .ap-ft-br:hover {
    background: #D9A94E;
  }
</style>

<div class="apollo-wrap">

  <!-- Apollo Panel -->
  <div class="ap">
    <div class="ap-bar">
      <div class="ap-dots">
        <div class="ap-dot" style="background:#FF5F57"></div>
        <div class="ap-dot" style="background:#FFBD2E"></div>
        <div class="ap-dot" style="background:#28C840"></div>
      </div>
      <div class="ap-title">Apollo · Procurement Intelligence</div>
      <div class="ap-live"><span class="ap-live-dot"></span>Live</div>
    </div>

    <div class="ap-tabs">
      <button class="ap-tab on" data-i="0">Negotiation Asst.</button>
      <button class="ap-tab" data-i="1">Quote Selection</button>
      <button class="ap-tab" data-i="2">Should-cost Model</button>
      <button class="ap-tab" data-i="3">Resilience Sentinel</button>
    </div>

    <div class="ap-body">

      <div class="ap-card on" id="apc-0">
        <div class="ap-card-hd">
          <span class="ap-name n-brass">Negotiation Assistant</span>
          <span class="ap-badge b-done">Strategy Ready</span>
        </div>
        <div class="ap-lbl">Agent Output</div>
        <div class="ap-out">
          Supplier X claiming raw material increases.<br>
          <span class="ot">Feedstock Y</span> dropped <span class="ow">12%</span> in 60 days.<br><br>
          Recommendation: Push back using<br>
          <span class="ob">attached price index chart.</span>
        </div>
        <div class="ap-src">Sources: <span>Market Report (Today), PLM Data, Competitor Pricing</span></div>
        <div class="ap-mets">
          <div class="ap-met">
            <div class="ap-mv">−<span class="ap-mu">8</span>%</div>
            <div class="ap-ml">Target reduction</div>
          </div>
          <div class="ap-met">
            <div class="ap-mv">3<span class="ap-mu">d</span></div>
            <div class="ap-ml">Strategy ready</div>
          </div>
          <div class="ap-met">
            <div class="ap-mv">94<span class="ap-mu">%</span></div>
            <div class="ap-ml">Confidence</div>
          </div>
        </div>
      </div>

      <div class="ap-card" id="apc-1">
        <div class="ap-card-hd">
          <span class="ap-name n-teal">Automated Quote Selection Agent</span>
          <span class="ap-badge b-run">Scanning Now</span>
        </div>
        <div class="ap-lbl">Live Market Signal</div>
        <div class="ap-out">
          Detected: <span class="ot">3 new qualified suppliers</span> in Vietnam<br>
          matching Category 4 specifications.<br><br>
          Avg. quoted price <span class="ow">14% below</span> current<br>
          incumbent. <span class="ob">Full profiles attached.</span>
        </div>
        <div class="ap-src">Sources: <span>Supplier DB, Trade Reports, Customs Data</span></div>
        <div class="ap-mets">
          <div class="ap-met">
            <div class="ap-mv">47<span class="ap-mu">+</span></div>
            <div class="ap-ml">Markets watched</div>
          </div>
          <div class="ap-met">
            <div class="ap-mv">24<span class="ap-mu">h</span></div>
            <div class="ap-ml">Signal latency</div>
          </div>
          <div class="ap-met">
            <div class="ap-mv">98<span class="ap-mu">%</span></div>
            <div class="ap-ml">Accuracy</div>
          </div>
        </div>
      </div>

      <div class="ap-card" id="apc-2">
        <div class="ap-card-hd">
          <span class="ap-name n-slate">Should-cost Modelling</span>
          <span class="ap-badge b-done">Analysis Complete</span>
        </div>
        <div class="ap-lbl">Should-Cost Model</div>
        <div class="ap-out">
          Part #A4821 — Current: <span class="ow">\$42.80</span><br>
          Should-cost: <span class="ot">\$34.20 – \$36.50</span><br><br>
          Overpaying by <span class="ow">17–25%</span>. Driver:<br>
          <span class="ob">inflated tooling amortisation claim.</span>
        </div>
        <div class="ap-src">Sources: <span>BOM, PLM System, Industry Cost Indices</span></div>
        <div class="ap-mets">
          <div class="ap-met">
            <div class="ap-mv">342<span class="ap-mu">+</span></div>
            <div class="ap-ml">Parts analysed</div>
          </div>
          <div class="ap-met">
            <div class="ap-mv">\$1.2<span class="ap-mu">M</span></div>
            <div class="ap-ml">Savings found</div>
          </div>
        </div>
      </div>

      <div class="ap-card" id="apc-3">
        <div class="ap-card-hd">
          <span class="ap-name n-teal">Resilience Sentinel</span>
          <span class="ap-badge b-alert">2 Alerts</span>
        </div>
        <div class="ap-lbl">Risk Assessment</div>
        <div class="ap-out">
          <span class="owarn">⚠ HIGH:</span> Supplier Y — financial distress.<br>
          D&amp;B score dropped <span class="ow">18pts</span> in 30 days.<br><br>
          <span class="ot">Recommended:</span> Accelerate dual-sourcing<br>
          <span class="ob">Cat. 3 components. Timeline: 6 weeks.</span>
        </div>
        <div class="ap-src">Sources: <span>D&amp;B Feed, News Monitoring, Filings</span></div>
        <div class="ap-mets">
          <div class="ap-met">
            <div class="ap-mv">12<span class="ap-mu">+</span></div>
            <div class="ap-ml">Risk dimensions</div>
          </div>
          <div class="ap-met">
            <div class="ap-mv">98<span class="ap-mu">%</span></div>
            <div class="ap-ml">Early warning</div>
          </div>
        </div>
      </div>

    </div>

    <div class="ap-dots-row">
      <button class="ap-ind on" data-i="0"></button>
      <button class="ap-ind" data-i="1"></button>
      <button class="ap-ind" data-i="2"></button>
      <button class="ap-ind" data-i="3"></button>
    </div>

    <div class="ap-ft">
      <div class="ap-ft-l"><span class="ap-ft-live">●</span> Apollo running 4 agents simultaneously</div>
      <div class="ap-ft-btns">
        <button class="ap-ft-btn ap-ft-gh">View All</button>
        <button class="ap-ft-btn ap-ft-br">Take Action</button>
      </div>
    </div>
  </div>

</div>

<script>
  (function(){
  var cur = 0, total = 4, timer;
  function go(i){
    const nextEl = document.getElementById('apc-'+i);
    const currEl = document.getElementById('apc-'+cur);
    const tabs = document.querySelectorAll('.ap-tab');
    const inds = document.querySelectorAll('.ap-ind');

    if (!nextEl || !currEl || !tabs[i] || !inds[i]) {
      if (timer) clearInterval(timer);
      return;
    }

    currEl.classList.remove('on');
    tabs[cur].classList.remove('on');
    inds[cur].classList.remove('on');
    cur = i;
    nextEl.classList.add('on');
    tabs[cur].classList.add('on');
    inds[cur].classList.add('on');
  }
  function auto(){ timer = setInterval(function(){ go((cur+1)%total); }, 3500); }
  document.querySelectorAll('.ap-tab,.ap-ind').forEach(function(el){
    el.addEventListener('click',function(){
      clearInterval(timer);
      go(parseInt(el.getAttribute('data-i')));
      auto();
    });
  });
  auto();
})();
</script>`}
              ></Script>
            </div>
          </div>
        </div>
      </div>
      <div className="home-thq-meet-the-agents-elm">
        <div className="home-thq-introduction-to-agents-elm">
          <span className="home-thq-teal-color-apollo-agent-suite-elm">
            ————— Apollo Agent Suite —————
          </span>
          <span className="home-thq-text-meet-you-new-elm">
            <span>Meet your new</span>
            <br className="home-text25"></br>
          </span>
          <span className="home-thq-text-strategy-team-elm">
            <span>Strategy Team.</span>
            <br className="home-text27"></br>
          </span>
          <span className="home-thq-text-sub-text-elm">
            <span>
              Don&apos;t look at this as software. Look at it as a suite of
              <span
                dangerouslySetInnerHTML={{
                  __html: ' ',
                }}
              />
            </span>
            <span className="home-text29">specialized AI agents</span>
            <span>
              {' '}
              helping you cover every blind spot in your supply chain.
            </span>
          </span>
          <div className="home-container4">
            <div className="home-container5">
              <Script
                html={`<div style="line-height:0; margin-top:24px; margin-bottom:-2px;">
  <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
    style="display:block;width:100%;height:64px;">
    <path d="M0 0 L1440 0 L1440 32 Q1080 64 720 52 Q360 40 0 64 Z" fill="#0F1421" />
    <path d="M0 64 Q360 40 720 52 Q1080 64 1440 32 L1440 64 Z" fill="#F4F6FA" />
  </svg>
</div>`}
              ></Script>
            </div>
          </div>
        </div>
        <AgentList1
          text={
            <Fragment>
              <span className="home-text31">Margin Expansion</span>
            </Fragment>
          }
          text1={
            <Fragment>
              <span className="home-text32">Margin Protection</span>
            </Fragment>
          }
          text2={
            <Fragment>
              <span className="home-text33">Productivity Improvement</span>
            </Fragment>
          }
          text3={
            <Fragment>
              <span className="home-text34">
                Analytics &amp; Data Management
              </span>
            </Fragment>
          }
          text4={
            <Fragment>
              <span className="home-text35">Margin Expansion</span>
            </Fragment>
          }
          text5={
            <Fragment>
              <span className="home-text36">Agents that grow your margin</span>
            </Fragment>
          }
          text6={
            <Fragment>
              <span className="home-text37">
                Identify and capture untapped savings across your direct spend.
              </span>
            </Fragment>
          }
          text11={
            <Fragment>
              <span className="home-text38">Margin Protection</span>
            </Fragment>
          }
          text21={
            <Fragment>
              <span className="home-text39">Productivity Improvement</span>
            </Fragment>
          }
          text31={
            <Fragment>
              <span className="home-text40">
                Analytics &amp; Data Management
              </span>
            </Fragment>
          }
          text51={
            <Fragment>
              <span className="home-text41">
                Agents that defend your margin
              </span>
            </Fragment>
          }
          text61={
            <Fragment>
              <span className="home-text42">
                Monitor risks, track compliance, and flag supplier issues before
                they cost you.
              </span>
            </Fragment>
          }
          eyeBrow={
            <Fragment>
              <span className="home-text43">MARGIN EXPANSION</span>
            </Fragment>
          }
          text511={
            <Fragment>
              <span className="home-text44">
                Agents that accelerate your team
              </span>
            </Fragment>
          }
          text611={
            <Fragment>
              <span className="home-text45">
                Automate repetitive work so your buyers focus on strategic
                decisions.
              </span>
            </Fragment>
          }
          eyeBrow2={
            <Fragment>
              <span className="home-text46">MARGIN PROTECTION</span>
            </Fragment>
          }
          eyeBrow3={
            <Fragment>
              <span className="home-text47">AGENT CATEGORIES</span>
            </Fragment>
          }
          text5111={
            <Fragment>
              <span className="home-text48">
                Agents that sharpen your insights
              </span>
            </Fragment>
          }
          text6111={
            <Fragment>
              <span className="home-text49">
                Turn raw procurement data into decision-ready intelligence.
              </span>
            </Fragment>
          }
          eyeBrow21={
            <Fragment>
              <span className="home-text50">PRODUCTIVITY IMPROVEMENT</span>
            </Fragment>
          }
          eyeBrow211={
            <Fragment>
              <span className="home-text51">
                ANALYTICS &amp; DATA MANAGEMENT
              </span>
            </Fragment>
          }
        ></AgentList1>
        <div className="home-thq-cta-strip-elm">
          <div className="home-thq-cta-left-column-elm">
            <span className="home-text52">
              See all Apollo agents in action.
            </span>
            <span className="home-text53">
              30-minute demo. Live walkthrough. Your own spend data if
              you&apos;d like.
            </span>
          </div>
          <div className="home-thq-cta-right-column-elm">
            <div className="home-thq-cta-buttons-elm">
              <GostTealButton
                rootClassName="gost-teal-buttonroot-class-name1"
                gostTealButton={
                  <Fragment>
                    <span className="home-text54">Download Agent Overview</span>
                  </Fragment>
                }
                onClick={() => setShowDownloadModal(true)}
              ></GostTealButton>
              <PrimaryButton
                rootClassName="primary-buttonroot-class-name2"
                primaryButtonTest={
                  <Fragment>
                    <span className="home-text55">Request Demo</span>
                  </Fragment>
                }
                link="https://outlook.office.com/bookwithme/user/8b876d6424a5445e960d92a2a28db077@scmmax.com/meetingtype/NvRUL87SiUuK83_PAIvasw2?anonymous&ismsaljsauthenabled&ep=mlink"
              ></PrimaryButton>
            </div>
          </div>
        </div>
      </div>
      <Footer
        blog={
          <Fragment>
            <span className="home-text56">Blog</span>
          </Fragment>
        }
        text={
          <Fragment>
            <span className="home-text57">
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
            <span className="home-text58">About</span>
          </Fragment>
        }
        text1={
          <Fragment>
            <span className="home-text59">Always Ready. Always Ahead.</span>
          </Fragment>
        }
        text2={
          <Fragment>
            <span className="home-text60">
              AI-powered procurement intelligence for enterprise buying teams.
            </span>
          </Fragment>
        }
        text3={
          <Fragment>
            <span className="home-text61">Privacy Policy</span>
          </Fragment>
        }
        text4={
          <Fragment>
            <span className="home-text62">Terms of Service</span>
          </Fragment>
        }
        text5={
          <Fragment>
            <span className="home-text63"> Apollo</span>
          </Fragment>
        }
        careers={
          <Fragment>
            <span className="home-text64">Careers</span>
          </Fragment>
        }
        company={
          <Fragment>
            <span className="home-text65">COMPANY</span>
          </Fragment>
        }
        product={
          <Fragment>
            <span className="home-text66">PRODUCT</span>
          </Fragment>
        }
        services={
          <Fragment>
            <span className="home-text67">SERVICES</span>
          </Fragment>
        }
        contactUs={
          <Fragment>
            <span className="home-text68">Contact Us</span>
          </Fragment>
        }
        consulting={
          <Fragment>
            <span className="home-text69">Consulting</span>
          </Fragment>
        }
        dataServices={
          <Fragment>
            <span className="home-text70">Data Services</span>
          </Fragment>
        }
        productivity={
          <Fragment>
            <span className="home-text71">Productivity</span>
          </Fragment>
        }
        dataAnalytics={
          <Fragment>
            <span className="home-text72">Data &amp; Analytics</span>
          </Fragment>
        }
        apolloPlatform={
          <Fragment>
            <span className="home-text73">Apollo Platform</span>
          </Fragment>
        }
        buyingServices={
          <Fragment>
            <span className="home-text74">Buying Services</span>
          </Fragment>
        }
        marginExpansion={
          <Fragment>
            <span className="home-text75">Margin Expansion</span>
          </Fragment>
        }
        marginProtection={
          <Fragment>
            <span className="home-text76">Margin Protection</span>
          </Fragment>
        }
        forwardDeployedEngineers={
          <Fragment>
            <span className="home-text77">Forward Deployed Engineers</span>
          </Fragment>
        }
      ></Footer>
      <PrimaryButton
        rootClassName="primary-buttonroot-class-name3"
        primaryButtonTest={
          <Fragment>
            <span className="home-text78">Button</span>
          </Fragment>
        }
      ></PrimaryButton>
      <CardWrapperBrass
        tag={
          <Fragment>
            <span className="home-text79">AQS Agent</span>
          </Fragment>
        }
        link={
          <Fragment>
            <span className="home-text80">Explore-&gt;</span>
          </Fragment>
        }
        title={
          <Fragment>
            <span className="home-text81">
              Automated Quote Initiation &amp; Selection
            </span>
          </Fragment>
        }
        eyeBrow={
          <Fragment>
            <span className="home-text82">Operational AI</span>
          </Fragment>
        }
        bodyText={
          <Fragment>
            <span className="home-text83">
              The AI agent uses MRP output, initiates RFQ and compares the
              emails from suppliers or the uploads to Ariba
            </span>
          </Fragment>
        }
        rootClassName="card-wrapper-brassroot-class-name6"
      ></CardWrapperBrass>
      <SecondaryButton
        rootClassName="secondary-buttonroot-class-name"
        secondaryButton={
          <Fragment>
            <span className="home-text84">Button</span>
          </Fragment>
        }
      ></SecondaryButton>
      <GostTealButton
        rootClassName="gost-teal-buttonroot-class-name2"
        gostTealButton={
          <Fragment>
            <span className="home-text85">Button</span>
          </Fragment>
        }
      ></GostTealButton>
      <CardWrapperTeal
        tag={
          <Fragment>
            <span className="home-text86">AQS Agent</span>
          </Fragment>
        }
        link={
          <Fragment>
            <span className="home-text87">Explore-&gt;</span>
          </Fragment>
        }
        title={
          <Fragment>
            <span className="home-text88">
              Automated Quote Initiation &amp; Selection
            </span>
          </Fragment>
        }
        eyeBrow={
          <Fragment>
            <span className="home-text89">Operational AI</span>
          </Fragment>
        }
        bodyText={
          <Fragment>
            <span className="home-text90">
              The AI agent uses MRP output, initiates RFQ and compares the
              emails from suppliers or the uploads to Ariba
            </span>
          </Fragment>
        }
        rootClassName="card-wrapper-tealroot-class-name4"
      ></CardWrapperTeal>
      <CardWrapperSlate
        tag={
          <Fragment>
            <span className="home-text91">AQS Agent</span>
          </Fragment>
        }
        link={
          <Fragment>
            <span className="home-text92">Explore-&gt;</span>
          </Fragment>
        }
        title={
          <Fragment>
            <span className="home-text93">
              Automated Quote Initiation &amp; Selection
            </span>
          </Fragment>
        }
        eyeBrow={
          <Fragment>
            <span className="home-text94">Operational AI</span>
          </Fragment>
        }
        bodyText={
          <Fragment>
            <span className="home-text95">
              The AI agent uses MRP output, initiates RFQ and compares the
              emails from suppliers or the uploads to Ariba
            </span>
          </Fragment>
        }
        rootClassName="card-wrapper-slateroot-class-name4"
      ></CardWrapperSlate>
      <CardWrapperBrass1
        tag={
          <Fragment>
            <span className="home-text96">AQS Agent</span>
          </Fragment>
        }
        link={
          <Fragment>
            <span className="home-text97">Explore-&gt;</span>
          </Fragment>
        }
        title={
          <Fragment>
            <span className="home-text98">
              Automated Quote Initiation &amp; Selection
            </span>
          </Fragment>
        }
        eyeBrow={
          <Fragment>
            <span className="home-text99">Operational AI</span>
          </Fragment>
        }
        bodyText={
          <Fragment>
            <span className="home-text100">
              The AI agent uses MRP output, initiates RFQ and compares the
              emails from suppliers or the uploads to Ariba
            </span>
          </Fragment>
        }
        rootClassName="card-wrapper-brass1root-class-name8"
      ></CardWrapperBrass1>
      <DemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      ></DemoModal>
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      ></DownloadModal>
    </div>
  )
}

export default Home
