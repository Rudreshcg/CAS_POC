import React, { useState, Fragment } from 'react'
import DemoModal from '../components/demo-modal'
import DownloadModal from '../components/download-modal'

import Script from 'dangerous-html/react'
import { Helmet } from 'react-helmet'

import NavbarInteractive from '../components/navbar-interactive'
import GostTealButton from '../components/gost-teal-button'
import PrimaryButton from '../components/primary-button'
import Footer from '../components/footer'
import './services.css'

const Services = (props) => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

  const handleOpenDemo = () => setIsDemoModalOpen(true)
  const handleCloseDemo = () => setIsDemoModalOpen(false)
  const handleOpenDownload = () => setIsDownloadModalOpen(true)
  const handleCloseDownload = () => setIsDownloadModalOpen(false)

  const handleDemoLink = () => {
    window.open('https://outlook.office.com/book/RequestDemoSchedulingPage@scmmax.com/?ismsaljsauthenabled', '_blank');
  }
  return (
    <div id="services" className="services-container1">
      <Helmet>
        <title>Services - Practical Mean Cassowary</title>
        <meta
          property="og:title"
          content="Services - Practical Mean Cassowary"
        />
        <link
          rel="canonical"
          href="https://practical-mean-cassowary-094j40.teleporthq.site/services"
        />
        <meta
          property="og:url"
          content="https://practical-mean-cassowary-094j40.teleporthq.site/services"
        />
      </Helmet>
      <NavbarInteractive
        home={
          <Fragment>
            <span className="services-text10">Home</span>
          </Fragment>
        }
        text={
          <Fragment>
            <span className="services-text11"> Apollo</span>
          </Fragment>
        }
        text1={
          <Fragment>
            <span className="services-text12">About Us</span>
          </Fragment>
        }
        text3={
          <Fragment>
            <span className="services-text13">Home</span>
          </Fragment>
        }
        text4={
          <Fragment>
            <span className="services-text14">Products</span>
          </Fragment>
        }
        text5={
          <Fragment>
            <span className="services-text15">Services</span>
          </Fragment>
        }
        text8={
          <Fragment>
            <span className="services-text16"> Apollo</span>
          </Fragment>
        }
        text51={
          <Fragment>
            <span className="services-text17">Careers</span>
          </Fragment>
        }
        products={
          <Fragment>
            <span className="services-text18">Products</span>
          </Fragment>
        }
        register={
          <Fragment>
            <span className="services-text19">request Demo</span>
          </Fragment>
        }
        services={
          <Fragment>
            <span className="services-text20">Services</span>
          </Fragment>
        }
        services2={
          <Fragment>
            <span className="services-text21">About Us</span>
          </Fragment>
        }
        rootClassName="navbar-interactiveroot-class-name"
        primaryButtonTest={
          <Fragment>
            <span className="services-text22">Request Demo</span>
          </Fragment>
        }
      ></NavbarInteractive>
      <div className="services-thq-services-hero-elm">
        <div className="services-thq-hero-inner-elm">
          <span className="services-thq-eyebrow-elm1">
            ————— What We Do —————
          </span>
          <span className="services-thq-headline1-elm">
            Decades of expertise.
          </span>
          <span className="services-thq-headline2-elm">
            Amplified by Apollo.
          </span>
          <span className="services-thq-subheading-elm">
            We are not just a software company. We are a team with several
            decades of leading large direct procurement mandates — now powered
            by Apollo to deliver outcomes that software alone cannot.
          </span>
        </div>
        <div className="services-thq-pillar-cards-elm">
          <div className="services-thq-pillar1-elm">
            <span className="services-thq-number-elm1">01</span>
            <span className="services-thq-name-elm1">Buying Services</span>
            <span className="services-thq-description-elm10">
              End-to-end procurement execution powered by Apollo
            </span>
          </div>
          <div className="services-thq-pillar2-elm">
            <span className="services-thq-number-elm2">02</span>
            <span className="services-thq-name-elm2">Consulting</span>
            <span className="services-thq-description-elm11">
              Margin expansion projects using AI-led analysis
            </span>
          </div>
          <div className="services-thq-pillar3-elm">
            <span className="services-thq-number-elm3">03</span>
            <span className="services-thq-name-elm3">Data Services</span>
            <span className="services-thq-description-elm12">
              Master data readiness for AI-powered procurement
            </span>
          </div>
          <div className="services-thq-pillar4-elm">
            <span className="services-thq-number-elm4">04</span>
            <span className="services-thq-name-elm4">
              Forward Deployed Engineers
            </span>
            <span className="services-thq-description-elm13">
              Dedicated experts ensuring Apollo delivers for you
            </span>
          </div>
        </div>
      </div>
      <div className="services-container2">
        <div className="services-container3">
          <Script
            html={`<div style="line-height:0; margin-top:40px; margin-bottom:-2px;">
  <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
    style="display:block;width:100%;height:48px;">
    <path d="M0 0 L1440 0 L1440 24 Q1080 48 720 40 Q360 32 0 48 Z" fill="#0F1421" />
    <path d="M0 48 Q360 32 720 40 Q1080 48 1440 24 L1440 48 Z" fill="#FFFFFF" />
  </svg>
</div>`}
          ></Script>
        </div>
      </div>
      <div className="services-thq-buying-services-section-elm">
        <div className="services-thq-buying-services-inner-section-elm">
          <div className="services-thq-buying-services-left-column-elm">
            <span className="services-thq-eye-brow-elm1">
              {' '}
              —— 01 — Buying Services
            </span>
            <span className="services-thq-titel-line1-elm1">
              Your buying team,
            </span>
            <span className="services-thq-title-line2-elm1">always ready.</span>
            <span className="services-thq-sub-title-elm1">
              Our team has several decades of leading large direct procurement
              mandates — now powered by Apollo. We operate on a Base + Outcome
              model, aligning our success directly with your margin. Pick
              exactly what you need — from annual negotiations to a fully
              managed buying function.
            </span>
            <div className="services-thq-industries-block-elm">
              <span className="services-thq-industries-we-serve-elm">
                INDUSTRIES WE SERVE
              </span>
              <div className="services-thq-industry-tags-row-elm">
                <span className="services-text23">Consumer Goods</span>
                <span className="services-text24">Food &amp; Beverages</span>
                <span className="services-text25">Chemicals &amp; Pharma</span>
                <span className="services-text26">Oil &amp; Gas</span>
              </div>
            </div>
            <div className="services-thq-model-elm">
              <span className="services-text27">
                Base Cost + Outcome model. A fixed retainer covers our team and
                Apollo. Savings above the baseline are shared — we win only when
                you win.
              </span>
            </div>
          </div>
          <div className="services-thq-buying-services-right-column-elm">
            <div className="services-thq-service-card1-elm">
              <span className="services-thq-number-elm5">01</span>
              <span className="services-thq-title-elm1">
                Annual Negotiations &amp; Contracting
              </span>
              <span className="services-thq-desc-elm1">
                Apollo prepares your team for every negotiation — market
                intelligence, should-cost models, supplier risk profiles, and
                pre-built playbooks. We run the negotiation, you keep the
                savings.
              </span>
            </div>
            <div className="services-thq-service-card2-elm">
              <span className="services-thq-number-elm6">02</span>
              <span className="services-thq-title-elm2">
                Sourcing &amp; Supplier Selection
              </span>
              <span className="services-thq-desc-elm2">
                End-to-end sourcing events — RFQ initiation, supplier
                qualification, bid analysis, and award recommendation — executed
                by our team with Apollo doing the heavy analytical lifting.
              </span>
            </div>
            <div className="services-thq-service-card3-elm">
              <span className="services-thq-number-elm7">03</span>
              <span className="services-thq-title-elm3">
                Contract Management &amp; Renewal Strategy
              </span>
              <span className="services-thq-desc-elm3">
                Proactive contract calendars, competitive benchmarks, and
                renewal playbooks built by Apollo — so you never walk into a
                renewal unprepared.
              </span>
            </div>
            <div className="services-thq-service-card4-elm">
              <span className="services-text28">● MOST CHOSEN</span>
              <span className="services-thq-number-elm8">04</span>
              <span className="services-thq-title-elm4">
                End-to-End Buying Service
              </span>
              <span className="services-thq-desc-elm4">
                Complete management of your direct procurement function. Our
                team handles strategy, sourcing, negotiation, and supplier
                relationships — with Apollo running 24/7 in the background.
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="services-thq-consulting-services-section-elm">
        <div className="services-thq-consulting-inner-elm">
          <span className="services-thq-eyebrow-elm2">—— 02 — Consulting</span>
          <span className="services-thq-title-line1-elm">
            Procurement expertise,
          </span>
          <span className="services-thq-title-line2-elm2">
            structured for results.
          </span>
          <span className="services-thq-sub-title-elm2">
            Engage our team for targeted margin expansion projects. Each
            engagement combines our category experience with Apollo&apos;s
            analytical depth to deliver sustainable cost benefits.
          </span>
        </div>
        <div className="services-thq-consulting-cards-elm">
          <div className="services-thq-card1-elm">
            <div className="services-thq-accent-bar-elm1"></div>
            <div className="services-thq-card-body-elm1">
              <span className="services-thq-badge-text-elm1">● APOLLO-LED</span>
              <span className="services-thq-number-text-elm1">01</span>
              <span className="services-thq-title-text-elm1">
                Procurement Prism
              </span>
              <span className="services-thq-description-text-elm1">
                <span>
                  A strategic engagement where Apollo analyses every direct
                  spend category and individual material — identifying levers
                  and structuring a sustainable cost reduction roadmap.·
                  <span
                    dangerouslySetInnerHTML={{
                      __html: ' ',
                    }}
                  />
                </span>
                <br></br>
                <span> · Strategic sourcing with smart indexed contracts</span>
                <br></br>
                <span> · Focused market interventions</span>
                <br></br>
                <span> · Spec optimization — raw material and packaging</span>
                <br></br>
                <span> · Tail spend management</span>
                <br></br>
                <span> · Total cost of ownership across the value chain</span>
              </span>
            </div>
            <div className="services-thq-card-footer-elm1">
              <span className="services-text40">EXPLORE -&gt;</span>
            </div>
          </div>
          <div className="services-thq-card2-elm">
            <div className="services-thq-accent-bar-elm2"></div>
            <div className="services-thq-card-body-elm2">
              <span className="services-thq-badge-text-elm2">
                ● APOLLO-ASSISTED
              </span>
              <span className="services-thq-number-text-elm2">02</span>
              <span className="services-thq-title-text-elm2">
                Material Substitution
              </span>
              <span className="services-thq-description-text-elm2">
                A one-time exercise where SCMmax analyses your direct
                procurement spend to find lower-cost material alternatives —
                working with your factory, purchase, and R&amp;D teams to
                validate substitutes.
              </span>
            </div>
            <div className="services-thq-card-footer-elm2">
              <span className="services-text41">EXPLORE -&gt;</span>
            </div>
          </div>
          <div className="services-thq-card3-elm">
            <div className="services-thq-accent-bar-elm3"></div>
            <div className="services-thq-card-body-elm3">
              <span className="services-thq-badge-text-elm3">
                ● APOLLO-POWERED
              </span>
              <span className="services-thq-number-text-elm3">03</span>
              <span className="services-thq-title-text-elm3">
                Alternate Suppliers
              </span>
              <span className="services-thq-description-text-elm3">
                Our buying team brings a vast network across direct spend
                categories. Apollo scans trade data to identify alternate
                suppliers meeting your technical, functional, and cost criteria.
              </span>
            </div>
            <div className="services-thq-card-footer-elm3">
              <span className="services-text42">EXPLORE -&gt;</span>
            </div>
          </div>
          <div className="services-thq-card4-elm">
            <div className="services-thq-accent-bar-elm4"></div>
            <div className="services-thq-card-body-elm4">
              <span className="services-thq-badge-text-elm4">
                ● APOLLO-ENABLED
              </span>
              <span className="services-thq-number-text-elm4">04</span>
              <span className="services-thq-title-text-elm4">
                Capability Building
              </span>
              <span className="services-thq-description-text-elm4">
                Adoption programs designed for real operators to ensure
                AI-driven change actually sticks. We work with your buying teams
                to embed Apollo into daily workflows — not just as a tool, but
                as the way work gets done.
              </span>
            </div>
            <div className="services-thq-card-footer-elm4">
              <span className="services-text43">EXPLORE -&gt;</span>
            </div>
          </div>
        </div>
      </div>
      <div className="services-thq-data-services-section-elm">
        <div className="services-thq-data-services-inner-row-elm">
          <div className="services-thq-left-column-data-services-elm">
            <span className="services-thq-eye-brow-elm2">
              —— 03 — Data Services
            </span>
            <span className="services-thq-title1-elm">Your data,</span>
            <span className="services-thq-title2-elm">ready for AI.</span>
            <span className="services-thq-sub-title-elm3">
              Procurement data — especially material master and vendor master —
              is rarely AI-ready. Insufficient descriptions, duplicates, and
              inconsistencies prevent Apollo from operating at full
              effectiveness. We fix that.
            </span>
            <div className="services-thq-data-service1-elm">
              <div className="services-thq-icon-box-elm1">
                <span>✨</span>
              </div>
              <div className="services-thq-text-block-elm1">
                <span className="services-thq-title-elm5">Data Enrichment</span>
                <span className="services-thq-description-elm14">
                  Thin or inconsistent material descriptions are enriched with
                  structured attributes — making every record searchable and
                  AI-interpretable.
                </span>
              </div>
            </div>
            <div className="services-thq-data-service2-elm">
              <div className="services-thq-icon-box-elm2">
                <span>🧹</span>
              </div>
              <div className="services-thq-text-block-elm2">
                <span className="services-thq-title-elm6">
                  Data De-duplication
                </span>
                <span className="services-thq-description-elm15">
                  Apollo identifies and resolves duplicate material and vendor
                  records — creating a single clean master record for each
                  entity.
                </span>
              </div>
            </div>
            <div className="services-thq-data-service3-elm">
              <div className="services-thq-icon-box-elm3">
                <span>🏢</span>
              </div>
              <div className="services-thq-text-block-elm3">
                <span className="services-thq-title-elm7">
                  Vendor Golden Records
                </span>
                <span className="services-thq-description-elm16">
                  Fragmented vendor data across systems is consolidated into a
                  single authoritative Vendor Golden Record — complete with
                  enriched contact and compliance data.
                </span>
              </div>
            </div>
          </div>
          <div className="services-thq-right-column-data-services-elm">
            <div className="services-thq-dark-visual-column-elm">
              <span className="services-thq-label-elm1">BEFORE APOLLO</span>
              <div className="services-thq-item-row1-elm">
                <span className="services-text44">⚠️</span>
                <div className="services-thq-inner-column-elm1">
                  <span className="services-text45">Raw Material Master</span>
                  <span className="services-text46">
                    12,400 records — 34% duplicates, thin descriptions
                  </span>
                </div>
              </div>
              <div className="services-thq-item-row2-elm">
                <span className="services-text47">⚠️</span>
                <div className="services-thq-inner-column-elm2">
                  <span className="services-text48">Vendor Master</span>
                  <span className="services-text49">
                    3,200 vendors — inconsistent names, missing data
                  </span>
                </div>
              </div>
              <span className="services-thq-arrow-text-elm">
                ↓ Apollo Data Services ↓
              </span>
              <span className="services-thq-label-elm2">AFTER APOLLO</span>
              <div className="services-thq-output-box-elm">
                <span className="services-thq-label-elm3">✓ AI-READY DATA</span>
                <div className="services-thq-row-of-tags-elm">
                  <span className="services-thq-text1-elm">Clean records</span>
                  <span className="services-thq-text2-elm">
                    Golden vendor records
                  </span>
                  <span className="services-thq-text3-elm">
                    Rich descriptions
                  </span>
                  <span className="services-thq-text4-elm">
                    Zero duplicates
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="services-thq-fde-section-elm">
        <div className="services-thq-fde-inner-elm">
          <span className="services-thq-eye-brow-elm3">
            ————— 04 — Forward Deployed Engineers —————
          </span>
          <span className="services-thq-titel-line1-elm2">
            We don&apos;t just deploy Apollo.
          </span>
          <span className="services-thq-title-line2-elm3">
            We make it work for you.
          </span>
          <span className="services-thq-sub-title-elm4">
            For the first year, a dedicated SCMmax engineer is embedded with
            your team — ensuring Apollo understands your data, your context, and
            your goals.
          </span>
          <div className="services-thq-fde-activities-elm">
            <div className="services-thq-activity1-elm">
              <div className="services-thq-dot-elm1"></div>
              <span className="services-thq-title-text-elm5">
                Apollo Configuration
              </span>
              <span className="services-thq-description-elm17">
                SCMmax configures Apollo agents specifically in your
                company&apos;s network and for your categories, spend structure,
                supplier base, and internal processes.
              </span>
            </div>
            <div className="services-thq-activity2-elm">
              <div className="services-thq-dot-elm2"></div>
              <span className="services-thq-title-text-elm6">
                Team Enablement
              </span>
              <span className="services-thq-description-elm18">
                Working directly with your buying teams to ensure they get
                maximum value from every Apollo agent — every day.
              </span>
            </div>
            <div className="services-thq-activity3-elm">
              <div className="services-thq-dot-elm3"></div>
              <span className="services-thq-title-text-elm7">
                Monthly Value Reporting
              </span>
              <span className="services-thq-description-elm19">
                Clear, executive-ready reporting on the value Apollo has
                delivered — savings identified, actions taken, outcomes
                achieved.
              </span>
            </div>
            <div className="services-thq-activity4-elm">
              <div className="services-thq-dot-elm4"></div>
              <span className="services-thq-title-text-elm8">
                Continuous Improvement
              </span>
              <span className="services-thq-description-elm20">
                Ongoing refinement of Apollo&apos;s process and context inputs —
                ensuring accuracy and relevance as your business evolves.
              </span>
            </div>
          </div>
          <div className="services-thq-fdecta-elm">
            <div className="services-thq-left-column-elm">
              <span className="services-thq-title-elm8">
                Ready to see what Apollo + our team can do for your margins?
              </span>
              <span className="services-thq-sub-title-elm5">
                30-minute conversation. No slides. Just your spend data and our
                experience.
              </span>
            </div>
            <div className="services-thq-right-row-elm">
              <GostTealButton
                rootClassName="gost-teal-buttonroot-class-name3"
                onClick={handleOpenDownload}
                gostTealButton={
                  <Fragment>
                    <span className="services-text50">
                      DOWNLOAD SERVICES OVERVIEW
                    </span>
                  </Fragment>
                }
              ></GostTealButton>
              <PrimaryButton
                rootClassName="primary-buttonroot-class-name4"
                onClick={handleDemoLink}
                primaryButtonTest={
                  <Fragment>
                    <span className="services-text51">REQUEST DEMO</span>
                  </Fragment>
                }
              ></PrimaryButton>
            </div>
          </div>
        </div>
      </div>
      <Footer
        blog={
          <Fragment>
            <span className="services-text52">Blog</span>
          </Fragment>
        }
        text={
          <Fragment>
            <span className="services-text53">
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
            <span className="services-text54">About</span>
          </Fragment>
        }
        text1={
          <Fragment>
            <span className="services-text55">Always Ready. Always Ahead.</span>
          </Fragment>
        }
        text2={
          <Fragment>
            <span className="services-text56">
              AI-powered procurement intelligence for enterprise buying teams.
            </span>
          </Fragment>
        }
        text3={
          <Fragment>
            <span className="services-text57">Privacy Policy</span>
          </Fragment>
        }
        text4={
          <Fragment>
            <span className="services-text58">Terms of Service</span>
          </Fragment>
        }
        text5={
          <Fragment>
            <span className="services-text59"> Apollo</span>
          </Fragment>
        }
        careers={
          <Fragment>
            <span className="services-text60">Careers</span>
          </Fragment>
        }
        company={
          <Fragment>
            <span className="services-text61">COMPANY</span>
          </Fragment>
        }
        product={
          <Fragment>
            <span className="services-text62">PRODUCT</span>
          </Fragment>
        }
        services={
          <Fragment>
            <span className="services-text63">SERVICES</span>
          </Fragment>
        }
        contactUs={
          <Fragment>
            <span className="services-text64">Contact Us</span>
          </Fragment>
        }
        consulting={
          <Fragment>
            <span className="services-text65">Consulting</span>
          </Fragment>
        }
        dataServices={
          <Fragment>
            <span className="services-text66">Data Services</span>
          </Fragment>
        }
        productivity={
          <Fragment>
            <span className="services-text67">Productivity</span>
          </Fragment>
        }
        dataAnalytics={
          <Fragment>
            <span className="services-text68">Data &amp; Analytics</span>
          </Fragment>
        }
        rootClassName="footerroot-class-name4"
        apolloPlatform={
          <Fragment>
            <span className="services-text69">Apollo Platform</span>
          </Fragment>
        }
        buyingServices={
          <Fragment>
            <span className="services-text70">Buying Services</span>
          </Fragment>
        }
        marginExpansion={
          <Fragment>
            <span className="services-text71">Margin Expansion</span>
          </Fragment>
        }
        marginProtection={
          <Fragment>
            <span className="services-text72">Margin Protection</span>
          </Fragment>
        }
        forwardDeployedEngineers={
          <Fragment>
            <span className="services-text73">Forward Deployed Engineers</span>
          </Fragment>
        }
      ></Footer>
      <DemoModal isOpen={isDemoModalOpen} onClose={handleCloseDemo} />
      <DownloadModal isOpen={isDownloadModalOpen} onClose={handleCloseDownload} />
    </div>
  )
}

export default Services
