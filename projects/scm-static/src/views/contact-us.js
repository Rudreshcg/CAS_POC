import React, { Fragment } from 'react'

import Script from 'dangerous-html/react'
import { Helmet } from 'react-helmet'

import NavbarInteractive from '../components/navbar-interactive'
import Footer from '../components/footer'
import './contact-us.css'

const ContactUs = (props) => {
  return (
    <div className="contact-us-container1">
      <Helmet>
        <title>Contact-Us - Practical Mean Cassowary</title>
        <meta
          property="og:title"
          content="Contact-Us - Practical Mean Cassowary"
        />
        <link
          rel="canonical"
          href="https://practical-mean-cassowary-094j40.teleporthq.site/contact-us"
        />
        <meta
          property="og:url"
          content="https://practical-mean-cassowary-094j40.teleporthq.site/contact-us"
        />
      </Helmet>
      <NavbarInteractive
        home={
          <Fragment>
            <span className="contact-us-text10">Home</span>
          </Fragment>
        }
        text={
          <Fragment>
            <span className="contact-us-text11"> Apollo</span>
          </Fragment>
        }
        text3={
          <Fragment>
            <span className="contact-us-text12">Home</span>
          </Fragment>
        }
        text4={
          <Fragment>
            <span className="contact-us-text13">Products</span>
          </Fragment>
        }
        text5={
          <Fragment>
            <span className="contact-us-text14">Services</span>
          </Fragment>
        }
        products={
          <Fragment>
            <span className="contact-us-text15">Products</span>
          </Fragment>
        }
        register={
          <Fragment>
            <span className="contact-us-text16">request Demo</span>
          </Fragment>
        }
        services={
          <Fragment>
            <span className="contact-us-text17">Services</span>
          </Fragment>
        }
        rootClassName="navbar-interactiveroot-class-name2"
        text8={
          <Fragment>
            <span className="contact-us-text18"> Apollo</span>
          </Fragment>
        }
        primaryButtonTest={
          <Fragment>
            <span className="contact-us-text19">Request Demo</span>
          </Fragment>
        }
      ></NavbarInteractive>
      <div className="contact-us-thq-hero-elm">
        <span className="contact-us-text20">----Request a demo----</span>
        <span className="contact-us-text21">30 minutes</span>
        <span className="contact-us-text22">Your Spend. Our team</span>
        <span className="contact-us-text23">
          No slides. No generic pitch. We connect Apollo to a sample of your
          spend data and show you exactly what it finds — in your categories,
          with your suppliers.
        </span>
      </div>
      <div className="contact-us-thq-wave-elm">
        <div className="contact-us-container2">
          <div className="contact-us-container3">
            <Script
              html={`<div style="line-height:0;margin:0;padding:0;display:block;overflow:hidden;">
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
      <div className="contact-us-thq-main-contact-elm">
        <div className="contact-us-thq-inner-wrapper-elm">
          <div className="contact-us-thq-left-column-elm1">
            <div className="contact-us-thq-what-happens-next-row-elm">
              <div className="contact-us-thq-inner-column-elm"></div>
              <span className="contact-us-text24">What Happens Next</span>
            </div>
            <span className="contact-us-thq-title1-elm">A demo built</span>
            <span className="contact-us-thq-title2-elm">around your spend</span>
            <span className="contact-us-thq-sub-title-elm">
              Most procurement demos show you the tool. Ours shows you the
              outcome — on your data, in your categories.
            </span>
            <div className="contact-us-thq-first-point-row-elm">
              <div className="contact-us-thq-number-column-elm1">
                <span className="contact-us-text25">01</span>
              </div>
              <div className="contact-us-thq-text-column-elm1">
                <span className="contact-us-text26">
                  We confirm your session within 24 hours
                </span>
                <span className="contact-us-text27">
                  A member of our team will reach out to confirm timing and ask
                  for a sample spend extract — purchase order history or spend
                  by supplier is enough to get started.
                </span>
              </div>
            </div>
            <div className="contact-us-thq-second-point-row-elm">
              <div className="contact-us-thq-number-column-elm2">
                <span className="contact-us-text28">02</span>
              </div>
              <div className="contact-us-thq-text-column-elm2">
                <span className="contact-us-text29">
                  Apollo runs on your spend before the call
                </span>
                <span className="contact-us-text30">
                  We run Procurement Prism across your spend extract —
                  identifying savings opportunities, supplier consolidation
                  levers, and category strategies specific to your business.
                </span>
              </div>
            </div>
            <div className="contact-us-thq-third-point-row-elm">
              <div className="contact-us-thq-number-column-elm3">
                <span className="contact-us-text31">03</span>
              </div>
              <div className="contact-us-thq-text-column-elm3">
                <span className="contact-us-text32">
                  30-minute session — your results, live
                </span>
                <span className="contact-us-text33">
                  We walk you through what Apollo found in your spend. You see
                  real output, not a demo environment. No slides, no sales
                  theatre.
                </span>
              </div>
            </div>
            <div className="contact-us-thq-fourth-point-row-elm">
              <div className="contact-us-thq-number-column-elm4">
                <span className="contact-us-text34">04</span>
              </div>
              <div className="contact-us-thq-text-column-elm4">
                <span className="contact-us-text35">
                  You decide if it&apos;s worth exploring further
                </span>
                <span className="contact-us-text36">
                  No pressure, no follow-up sequence. If the numbers make sense
                  for your business, we talk next steps. If not, you keep the
                  output.
                </span>
              </div>
            </div>
            <div className="contact-us-thq-trust-stats-row-elm">
              <div className="contact-us-thq-stat1-elm">
                <span className="contact-us-text37">90</span>
                <span className="contact-us-text38">
                  Days to first savings identified
                </span>
              </div>
              <div className="contact-us-thq-stat2-elm">
                <span className="contact-us-text39">3 - 5%</span>
                <span className="contact-us-text40">
                  Typical cost reduction in first scan
                </span>
              </div>
              <div className="contact-us-thq-stat3-elm">
                <span className="contact-us-thq-text-elm">16</span>
                <span className="contact-us-text41">
                  Agents working for your team
                </span>
              </div>
            </div>
          </div>
          <div className="contact-us-thq-right-column-elm">
            <div className="contact-us-thq-inner-row-elm">
              <div>
                <div className="contact-us-container5">
                  <Script
                    html={`<style>
  .fm-title {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 1.4rem;
    font-weight: 300;
    color: #0F1421;
    letter-spacing: -.02em;
    margin-bottom: 6px
  }

  .fm-sub {
    font-size: .82rem;
    color: #7A8AAE;
    line-height: 1.6;
    margin-bottom: 32px
  }

  .fm-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px
  }

  .fm-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px
  }

  .fm-label {
    font-size: .65rem;
    font-weight: 500;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #4A5880;
    font-family: 'DM Sans', sans-serif
  }

  .fm-input {
    padding: 11px 14px;
    border: 1px solid #E8ECF4;
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: .85rem;
    color: #0F1421;
    background: #F4F6FA;
    outline: none;
    transition: border-color 180ms, background 180ms;
    width: 100%
  }

  .fm-input:focus {
    border-color: #C9933A;
    background: #fff
  }

  .fm-input::placeholder {
    color: #A0AECC
  }

  .fm-input.err {
    border-color: #E53E3E;
    background: #FFF5F5
  }

  .fm-err {
    font-size: .68rem;
    color: #E53E3E;
    margin-top: 3px;
    display: none
  }

  .fm-err.show {
    display: block
  }

  select.fm-input {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%237A8AAE' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px
  }

  .fm-cb-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 4px
  }

  .fm-cb {
    display: flex;
    align-items: center;
    gap: 7px;
    cursor: pointer
  }

  .fm-cb input[type="checkbox"] {
    width: 15px;
    height: 15px;
    cursor: pointer;
    accent-color: #C9933A;
    flex-shrink: 0
  }

  .fm-cb span {
    font-size: .78rem;
    color: #3A4870;
    font-family: 'DM Sans', sans-serif
  }

  .fm-divider {
    height: 1px;
    background: #E8ECF4;
    margin: 20px 0
  }

  .fm-note {
    font-size: .72rem;
    color: #7A8AAE;
    line-height: 1.55;
    margin-bottom: 20px;
    display: flex;
    align-items: flex-start;
    gap: 8px
  }

  .fm-submit {
    width: 100%;
    padding: 15px 32px;
    background: #C9933A;
    border: none;
    border-radius: 4px;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: .78rem;
    font-weight: 500;
    letter-spacing: .06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 180ms
  }

  .fm-submit:hover {
    background: #E8C278
  }

  .fm-success {
    display: none;
    text-align: center;
    padding: 40px 20px
  }

  .fm-success.show {
    display: block
  }

  .fm-success-icon {
    font-size: 2.5rem;
    margin-bottom: 16px
  }

  .fm-success-title {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 1.4rem;
    font-weight: 300;
    color: #0F1421;
    margin-bottom: 8px
  }

  .fm-success-sub {
    font-size: .85rem;
    color: #4A5880;
    line-height: 1.7
  }
</style>

<p class="fm-title">Request your demo</p>
<p class="fm-sub">Takes 2 minutes. We'll be in touch within one business day.</p>

<div id="fm">
  <div class="fm-row">
    <div class="fm-group">
      <label class="fm-label">First name</label>
      <input type="text" id="fm-fn" class="fm-input" placeholder="Sarah">
      <span class="fm-err" id="fm-fn-e">Please enter your first name</span>
    </div>
    <div class="fm-group">
      <label class="fm-label">Last name</label>
      <input type="text" id="fm-ln" class="fm-input" placeholder="Chen">
      <span class="fm-err" id="fm-ln-e">Please enter your last name</span>
    </div>
  </div>

  <div class="fm-group">
    <label class="fm-label">Work email</label>
    <input type="email" id="fm-em" class="fm-input" placeholder="sarah.chen@yourcompany.com">
    <span class="fm-err" id="fm-em-e">Please use your company work email</span>
  </div>

  <div class="fm-group">
    <label class="fm-label">Job title</label>
    <input type="text" id="fm-jt" class="fm-input" placeholder="Chief Procurement Officer">
    <span class="fm-err" id="fm-jt-e">Please enter your job title</span>
  </div>

  <div class="fm-row">
    <div class="fm-group">
      <label class="fm-label">Company</label>
      <input type="text" id="fm-co" class="fm-input" placeholder="Acme Corp">
      <span class="fm-err" id="fm-co-e">Please enter your company</span>
    </div>
    <div class="fm-group">
      <label class="fm-label">Annual direct spend</label>
      <select id="fm-sp" class="fm-input">
        <option value="" disabled selected>Select range</option>
        <option>Under \$50M</option>
        <option>\$50M – \$200M</option>
        <option>\$200M – \$500M</option>
        <option>\$500M – \$1B</option>
        <option>Over \$1B</option>
      </select>
    </div>
  </div>

  <div class="fm-group">
    <label class="fm-label">ERP System (select all that apply)</label>
    <div class="fm-cb-group">
      <label class="fm-cb"><input type="checkbox" name="erp" value="SAP"><span>SAP</span></label>
      <label class="fm-cb"><input type="checkbox" name="erp" value="Oracle"><span>Oracle</span></label>
      <label class="fm-cb"><input type="checkbox" name="erp" value="NetSuite"><span>NetSuite</span></label>
      <label class="fm-cb"><input type="checkbox" name="erp" value="MS Dynamics"><span>MS Dynamics</span></label>
      <label class="fm-cb"><input type="checkbox" name="erp" value="Infor"><span>Infor</span></label>
      <label class="fm-cb"><input type="checkbox" name="erp" value="Other"><span>Other</span></label>
    </div>
  </div>

  <div class="fm-group">
    <label class="fm-label">Procurement System (select all that apply)</label>
    <div class="fm-cb-group">
      <label class="fm-cb"><input type="checkbox" name="proc" value="Ariba"><span>Ariba</span></label>
      <label class="fm-cb"><input type="checkbox" name="proc" value="Coupa"><span>Coupa</span></label>
      <label class="fm-cb"><input type="checkbox" name="proc" value="GEP"><span>GEP</span></label>
      <label class="fm-cb"><input type="checkbox" name="proc" value="Jaggaer"><span>Jaggaer</span></label>
      <label class="fm-cb"><input type="checkbox" name="proc" value="Ivalua"><span>Ivalua</span></label>
      <label class="fm-cb"><input type="checkbox" name="proc" value="Zycus"><span>Zycus</span></label>
      <label class="fm-cb"><input type="checkbox" name="proc" value="None"><span>None yet</span></label>
      <label class="fm-cb"><input type="checkbox" name="proc" value="Other"><span>Other</span></label>
    </div>
  </div>

  <div class="fm-divider"></div>

  <div class="fm-note">
    <span>🔒</span>
    <span>Your data is never shared, sold, or used to train any model. Any spend data you share for the demo stays within your agreed environment and is deleted after the session.</span>
  </div>

  <button class="fm-submit" onclick="fmSubmit(event)">Request My Demo →</button>
</div>

<div class="fm-success" id="fm-ok">
  <div class="fm-success-icon">✅</div>
  <div class="fm-success-title">We'll be in touch within 24 hours.</div>
  <div class="fm-success-sub">Thank you for your interest in Apollo. A member of our team will reach out shortly to
    confirm your session and next steps.</div>
</div>

<script>
  var FREE=['gmail.com','googlemail.com','yahoo.com','yahoo.co.uk','hotmail.com','hotmail.co.uk',
'outlook.com','live.com','msn.com','icloud.com','me.com','mac.com','aol.com','protonmail.com',
'proton.me','pm.me','tutanota.com','tuta.io','zoho.com','yandex.com','mail.com','gmx.com',
'gmx.net','fastmail.com','hey.com'];
var CORP=['deloitte.com','pwc.com','kpmg.com','ey.com','accenture.com','mckinsey.com',
'bcg.com','bain.com','ibm.com','capgemini.com','infosys.com','wipro.com','tcs.com',
'cognizant.com','hcl.com','oliverwyman.com','rolandberger.com','atkearney.com'];
function fmValidEmail(e){
  if(!e)return{ok:false,msg:'Please enter your work email'};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+\$/.test(e))return{ok:false,msg:'Please enter a valid email'};
  var d=e.split('@')[1].toLowerCase();
  if(FREE.indexOf(d)>-1)return{ok:false,msg:'Please use your company email — not a personal address'};
  if(CORP.indexOf(d)>-1)return{ok:false,msg:'Please use your company email, not a consulting firm email'};
  return{ok:true};
}
function fmErr(id,eid,msg){
  document.getElementById(id).classList.add('err');
  var e=document.getElementById(eid);e.textContent=msg;e.classList.add('show');
}
function fmClear(id,eid){
  document.getElementById(id).classList.remove('err');
  document.getElementById(eid).classList.remove('show');
}
document.getElementById('fm-em').addEventListener('blur',function(){
  var r=fmValidEmail(this.value.trim());
  if(!r.ok)fmErr('fm-em','fm-em-e',r.msg);else fmClear('fm-em','fm-em-e');
});
function fmSubmit(e){
  e.preventDefault();var ok=true;
  if(!document.getElementById('fm-fn').value.trim()){fmErr('fm-fn','fm-fn-e','Required');ok=false;}else fmClear('fm-fn','fm-fn-e');
  if(!document.getElementById('fm-ln').value.trim()){fmErr('fm-ln','fm-ln-e','Required');ok=false;}else fmClear('fm-ln','fm-ln-e');
  var r=fmValidEmail(document.getElementById('fm-em').value.trim());
  if(!r.ok){fmErr('fm-em','fm-em-e',r.msg);ok=false;}else fmClear('fm-em','fm-em-e');
  if(!document.getElementById('fm-jt').value.trim()){fmErr('fm-jt','fm-jt-e','Required');ok=false;}else fmClear('fm-jt','fm-jt-e');
  if(!document.getElementById('fm-co').value.trim()){fmErr('fm-co','fm-co-e','Required');ok=false;}else fmClear('fm-co','fm-co-e');
  if(!ok)return;
  document.getElementById('fm').style.display='none';
  document.getElementById('fm-ok').classList.add('show');
}
</script>`}
                  ></Script>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="contact-us-thq-social-proof-elm">
        <span className="contact-us-text42">
          What procurement leaders say after their first Apollo demo
        </span>
        <div className="contact-us-thq-conetnt-row-elm">
          <div className="contact-us-thq-proof1-elm">
            <span className="contact-us-thq-quote-elm1">
              I came in sceptical. Within 20 minutes Apollo had found three
              negotiation levers in our spend that our team had missed for two
              years.
            </span>
            <div className="contact-us-thq-said-by-elm1">
              <div className="contact-us-thq-left-column-elm2">
                <span className="contact-us-thq-initials-elm1">MR</span>
              </div>
              <div className="contact-us-thq-right-c-olumn-elm1">
                <span className="contact-us-thq-name-elm1">Michael R.</span>
                <span className="contact-us-thq-role-elm1">
                  CPO, Tier 1 Automotive Supplier
                </span>
              </div>
            </div>
          </div>
          <div className="contact-us-thq-proof2-elm">
            <span className="contact-us-thq-quote-elm2">
              The demo wasn&apos;t a demo — it was our actual spend data with
              real findings. That&apos;s when I knew this was different from
              every other procurement tool I&apos;d seen.
            </span>
            <div className="contact-us-thq-said-by-elm2">
              <div className="contact-us-thq-left-column-elm3">
                <span className="contact-us-thq-initials-elm2">JL</span>
              </div>
              <div className="contact-us-thq-right-c-olumn-elm2">
                <span className="contact-us-thq-name-elm2">Jennifer L.</span>
                <span className="contact-us-thq-role-elm2">
                  CFO, Chemical Manufacturer
                </span>
              </div>
            </div>
          </div>
          <div className="contact-us-thq-proof3-elm">
            <span className="contact-us-thq-quote-elm3">
              We signed within two weeks of the demo. The ROI case built itself
              — Apollo showed us exactly where the money was sitting in our
              supply base.
            </span>
            <div className="contact-us-thq-said-by-elm3">
              <div className="contact-us-thq-left-column-elm4">
                <span className="contact-us-thq-initials-elm3">DK</span>
              </div>
              <div className="contact-us-thq-right-c-olumn-elm3">
                <span className="contact-us-thq-name-elm3">David K.</span>
                <span className="contact-us-thq-role-elm3">
                  VP Procurement, Global FMCG
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer
        blog={
          <Fragment>
            <span className="contact-us-text43">Blog</span>
          </Fragment>
        }
        text={
          <Fragment>
            <span className="contact-us-text44">
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
            <span className="contact-us-text45">About</span>
          </Fragment>
        }
        text1={
          <Fragment>
            <span className="contact-us-text46">
              Always Ready. Always Ahead.
            </span>
          </Fragment>
        }
        text2={
          <Fragment>
            <span className="contact-us-text47">
              AI-powered procurement intelligence for enterprise buying teams.
            </span>
          </Fragment>
        }
        text3={
          <Fragment>
            <span className="contact-us-text48">Privacy Policy</span>
          </Fragment>
        }
        text4={
          <Fragment>
            <span className="contact-us-text49">Terms of Service</span>
          </Fragment>
        }
        text5={
          <Fragment>
            <span className="contact-us-text50"> Apollo</span>
          </Fragment>
        }
        careers={
          <Fragment>
            <span className="contact-us-text51">Careers</span>
          </Fragment>
        }
        company={
          <Fragment>
            <span className="contact-us-text52">COMPANY</span>
          </Fragment>
        }
        product={
          <Fragment>
            <span className="contact-us-text53">PRODUCT</span>
          </Fragment>
        }
        services={
          <Fragment>
            <span className="contact-us-text54">SERVICES</span>
          </Fragment>
        }
        contactUs={
          <Fragment>
            <span className="contact-us-text55">Contact Us</span>
          </Fragment>
        }
        consulting={
          <Fragment>
            <span className="contact-us-text56">Consulting</span>
          </Fragment>
        }
        dataServices={
          <Fragment>
            <span className="contact-us-text57">Data Services</span>
          </Fragment>
        }
        productivity={
          <Fragment>
            <span className="contact-us-text58">Productivity</span>
          </Fragment>
        }
        dataAnalytics={
          <Fragment>
            <span className="contact-us-text59">Data &amp; Analytics</span>
          </Fragment>
        }
        rootClassName="footerroot-class-name"
        apolloPlatform={
          <Fragment>
            <span className="contact-us-text60">Apollo Platform</span>
          </Fragment>
        }
        buyingServices={
          <Fragment>
            <span className="contact-us-text61">Buying Services</span>
          </Fragment>
        }
        marginExpansion={
          <Fragment>
            <span className="contact-us-text62">Margin Expansion</span>
          </Fragment>
        }
        marginProtection={
          <Fragment>
            <span className="contact-us-text63">Margin Protection</span>
          </Fragment>
        }
        forwardDeployedEngineers={
          <Fragment>
            <span className="contact-us-text64">
              Forward Deployed Engineers
            </span>
          </Fragment>
        }
      ></Footer>
    </div>
  )
}

export default ContactUs
