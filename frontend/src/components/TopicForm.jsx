import React, { useState } from 'react'
import { connect } from 'react-redux'
import topicFormPageActions from '../reducers/actions/topicFormPageActions'
import TextField from '@mui/material/TextField'
import { Radio, RadioGroup, Checkbox } from '@mui/material'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material'
import './TopicForm.css'

const isHelsinkiEmail = (email) => email && email.endsWith('@helsinki.fi')

const TopicForm = (props) => {
  const [agreement, setAgreement] = useState(false)
  const timing = props.content.summerDates
  const theme = useTheme()

  const bgColor = theme.palette.type === 'dark' ? '#202020' : '#ffffff'

  const boxStyle = {
    backgroundColor: agreement ? '' : bgColor,
    border: '2px solid #333',
    borderRadius: '5px',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    fontSize: '16px',
    color: theme.palette.text.primary,
    margin: '20px auto',
  }

  const organisation = props.content.organisation
  const timingNotSet = !timing || (timing && !timing.short && !timing.long && props.summerProject)

  const periodChecked = (what) => {
    if (!timing) {
      return false
    }
    const value = timing[what]
    return value
  }

  //console.log(props.content)

  const contract =
    props.content.organisation === 'company'
      ? 'https://github.com/HY-TKTL/TKT20007-Ohjelmistotuotantoprojekti/tree/master/sopimukset'
      : 'https://github.com/HY-TKTL/TKT20007-Ohjelmistotuotantoprojekti/tree/master/sopimukset'

  const isCompany = props.content.organisation && props.content.organisation === 'company'

  const iprNotSet = isCompany && props.content.ipRights === ''

  return (
    <div className="topic-form">
      <div className="preview-button">
        <Button variant="contained" color="primary" onClick={() => props.updatePreview(true)}>
          Preview
        </Button>
      </div>
      <form onSubmit={props.onSubmit}>
        <div>
          <TextField
            fullWidth
            required
            label="Title / Aihe"
            margin="normal"
            value={props.content.title}
            onChange={(e) => props.updateTitle(e.target.value)}
          />
        </div>
        <div>
          <TextField
            fullWidth
            required
            label="Customer / Asiakas"
            margin="normal"
            value={props.content.customerName}
            onChange={(e) => props.updateCustomerName(e.target.value)}
          />
        </div>
        <div>
          <TextField
            type="email"
            fullWidth
            required
            label="Contact email / Yhteyshenkilön sähköpostiosoite"
            margin="normal"
            value={props.content.email}
            onChange={(e) => props.updateEmail(e.target.value)}
            helperText={
              isHelsinkiEmail(props.content.email)
                ? '@helsinki.fi email address will be used for UniSign, therefore a phone number is not mandatory. / @helsinki.fi sähköpostiosoitetta käytetään UniSignia varten, joten puhelinnumero ei ole pakollinen.'
                : ''
            }
          />
        </div>
        <div>
          <TextField
            type="tel"
            fullWidth
            required={!isHelsinkiEmail(props.content.email)}
            label="Phone number (Hidden from students) / Puhelinnumero (piilotettu opiskelijoilta)"
            margin="normal"
            value={props.content.phoneNumber}
            onChange={(e) => props.updatePhoneNumber(e.target.value)}
            helperText={
              !isHelsinkiEmail(props.content.email)
                ? "A valid phone number is required for UniSign if you don't have an @helsinki.fi email address. / Toimiva puhelinnumero vaaditaan UniSignia varten, jos sinulla ei ole @helsinki.fi sähköpostiosoitetta."
                : ''
            }
          />
        </div>
        <div style={{ marginTop: 35 }}>
          Customer organization is / Asiakasorganisaatio on
          <RadioGroup
            aria-label="customer-organization"
            name="customer-organization"
            value={props.content.organisation}
            onChange={(e) => props.updateOrganisation(e.target.value)}
          >
            <div>
              <Radio checked={organisation === 'company'} value="company" />
              Company / yritys
            </div>
            <div>
              <Radio checked={organisation === 'nonprofit'} value="nonprofit" />
              Non-profit organization / järjestö
            </div>
            <div>
              <Radio value="research" checked={organisation === 'research'} />
              Research institute / tutkimuslaitos
            </div>
            <div>
              <Radio checked={organisation === 'uh'} value="uh" />
              University of Helsinki unit / Helsingin Yliopiston yksikkö
            </div>
          </RadioGroup>
        </div>

        {isCompany && (
          <div style={{ marginTop: 35, marginBottom: 40 }}>
            Intellectual property rights / Immateriaalioikeudet
            <RadioGroup
              aria-label="customer-organization"
              name="customer-organization"
              value={props.content.ipRights}
              onChange={(e) => props.updateIp(e.target.value)}
            >
              <div>
                <Radio checked={props.content.ipRights === 'open'} value="open" />
                Software is published under an open source license / Työ julkaistaan avoimella
                lisenssillä
              </div>
              <div>
                <Radio checked={props.content.ipRights === 'nonopen'} value="nonopen" />
                All rights to the outcome are transferred to the company / Yritykselle siirretään
                kaikki oikeudet tuotokseen
              </div>
            </RadioGroup>
          </div>
        )}

        {props.summerProject && (
          <div style={{ marginTop: 35, marginBottom: 40 }}>
            Suitable timing / Sopiva ajankohta
            <div>
              <Checkbox
                checked={periodChecked('short')}
                onChange={(e) => props.updateDates({ ...timing, short: e.target.checked })}
                color="primary"
              />{' '}
              the early summer project {props.dates.short}
            </div>
            <div>
              <Checkbox
                checked={periodChecked('long')}
                onChange={(e) => props.updateDates({ ...timing, long: e.target.checked })}
                color="primary"
              />{' '}
              the whole summer project {props.dates.long}
            </div>
          </div>
        )}

        <p>
          The fields below have Markdown support. / Seuraavia kenttiä voi muotoilla
          Markdown-notaatiolla. (
          <a href="https://guides.github.com/features/mastering-markdown/">
            Markdown instructions / Markdown ohjeet
          </a>
          )
        </p>
        <div>
          <TextField
            fullWidth
            required
            label="Description / Aiheen kuvaus"
            multiline
            rows={props.isEditForm ? '' : 7}
            margin="normal"
            value={props.content.description}
            onChange={(e) => props.updateDescription(e.target.value)}
          />
        </div>
        <div>
          <TextField
            fullWidth
            required
            label="Implementation environment / Toteutusympäristö"
            multiline
            rows={props.isEditForm ? '' : 7}
            margin="normal"
            value={props.content.environment}
            onChange={(e) => props.updateEnvironment(e.target.value)}
          />
        </div>
        <div>
          <TextField
            fullWidth
            label="Special requests / Erityisvaatimukset"
            multiline
            rows={props.isEditForm ? '' : 7}
            margin="normal"
            value={props.content.specialRequests}
            onChange={(e) => props.updateSpecialRequests(e.target.value)}
          />
        </div>
        <div>
          <TextField
            fullWidth
            label="Additional info / Lisätietoja"
            multiline
            rows={props.isEditForm ? '' : 7}
            margin="normal"
            value={props.content.additionalInfo}
            onChange={(e) => props.updateAdditionalInfo(e.target.value)}
          />
        </div>

        {((organisation && organisation.length === 0) || timingNotSet || iprNotSet) && (
          <div style={boxStyle}>
            {organisation && organisation.length === 0 && (
              <>
                <div style={{ padding: 10 }}>
                  Select the customer provider organisaation type, from below the contact
                  information
                </div>
                <div style={{ padding: 10 }}>
                  Valitse asiakasorganisaation tyyppi yhteystietojen alta
                </div>
              </>
            )}
            {organisation && organisation.length === 0 && timingNotSet && <br />}
            {timingNotSet && (
              <>
                <div style={{ padding: 10 }}>
                  Select the suitable timing for the project from above
                </div>
                <div style={{ padding: 10 }}>Valitse projektille sopiva ajankohta</div>
              </>
            )}
            {iprNotSet && (
              <>
                <div style={{ padding: 10 }}>
                  Select the type of intellectual property rights for the project from above
                </div>
                <div style={{ padding: 10 }}>Valitse immateriaalioikeuksien tyyppi projektille</div>
              </>
            )}
          </div>
        )}
        {!timingNotSet && organisation !== 'company' && organisation !== '' && !iprNotSet && (
          <div style={boxStyle}>
            <div style={{ marginTop: 10 }}>
              As a customer I promise to provide the group with the necessary information and
              resources for the project.
            </div>
            <div style={{ marginTop: 5 }}>
              Lupaan asiakkaana tarjota ryhmälle tarvittavat tiedot ja resurssit projektia varten.
            </div>

            <div style={{ marginTop: 10 }}>
              <Checkbox
                checked={agreement}
                onChange={(e) => setAgreement(e.target.checked)}
                color="primary"
              />
              I agree to the above / sitoudun ylläolevaan
            </div>
          </div>
        )}
        {!timingNotSet && organisation === 'company' && !iprNotSet && (
          <div style={boxStyle}>
            <div style={{ marginTop: 10 }}>
              If the project is selected for implementation
              <ul>
                <li>
                  As a customer I promise to provide the group with the necessary information and
                  resources for the project
                </li>
                <li>I commit to paying the support fee of €3,000 (+VAT)</li>
              </ul>
            </div>
            <div style={{ marginTop: 5 }}>
              Mikäli ehdottamani projekti toteutetaan
              <ul>
                <li>
                  lupaan asiakkaana tarjota ryhmälle tarvittavat tiedot ja resurssit projektia
                  varten
                </li>
                <li>sitoudun maksamaan yrityksiltä veloitettavan 3 000 euron (+alv) tukimaksun</li>
              </ul>
            </div>

            <div>
              IP Rights / Immateriaalioikeidet
              <ul>
                {props.content.ipRights === 'open' && (
                  <li style={{ marginTop: 10 }}>
                    Software is published under an open source license / Työ julkaistaan avoimella
                    lisenssillä
                  </li>
                )}
                {props.content.ipRights === 'nonopen' && (
                  <li style={{ marginTop: 10 }}>
                    All rights to the outcome are transferred to the company / Yritykselle
                    siirretään kaikki oikeudet tuotokseen
                  </li>
                )}
                <li>
                  See <a href={contract}>here</a> to see the contract / sopimus{' '}
                  <a href={contract}>täällä</a>{' '}
                </li>
              </ul>
            </div>

            <div>
              <div style={{ marginTop: 10 }}>
                <Checkbox
                  checked={agreement}
                  onChange={(e) => setAgreement(e.target.checked)}
                  color="primary"
                />
                I agree to the above and have read the contract / sitoudun ylläolevaan ja olen
                lukenut sopimuksen
              </div>
            </div>
          </div>
        )}
        <div className="form-buttons">
          <div className="form-button">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={organisation === '' || !agreement || iprNotSet}
            >
              {props.submitButtonText}
            </Button>
          </div>
          {props.isEditForm && (
            <div className="form-button">
              <Button variant="contained" color="primary" onClick={props.onCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    summerProject: state.registrationManagement.summerProject,
    dates: state.registrationManagement.summerDates,
  }
}

const mapDispatchToProps = {
  ...topicFormPageActions,
}

const ConnectedTopicForm = connect(mapStateToProps, mapDispatchToProps)(TopicForm)

export default ConnectedTopicForm
