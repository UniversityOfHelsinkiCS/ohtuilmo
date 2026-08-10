/* globals cy describe beforeEach it expect */
const visitTopicsPage = (visitArgs) => cy.visit('/topics', visitArgs)

const findTopicActiveCheckbox = (topicName) =>
  cy.get(`[data-cy-topic-name="${topicName}"]`).find('[data-cy="toggle-active"] input')

const getSendAcceptButton = (topicName) =>
  cy.get(`[data-cy-topic-name="${topicName}"]`).find('[data-cy="send-accept-mail"]')

const getSendRejectButton = (topicName) =>
  cy.get(`[data-cy-topic-name="${topicName}"]`).find('[data-cy="send-reject-mail"]')

const getSendReviewLinkButton = (topicName) =>
  cy.get(`[data-cy-topic-name="${topicName}"]`).find('[data-cy="send-customer-review-link-email"]')

const clickSendAcceptEmail = (topicName) => getSendAcceptButton(topicName).click()

const clickSendRejectEmail = (topicName) => getSendRejectButton(topicName).click()

const clickSendReviewLinkEmail = (topicName) => getSendReviewLinkButton(topicName).click()

/** @param {'finnish' | 'english'} language */
const clickEmailLanguage = (language) =>
  cy.get('[data-cy="email-language-menu"]').find(`[data-cy-send-mail-lang="${language}"]`).click()

describe('Topic list page', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
  })

  describe('configuration selector', () => {
    beforeEach(() => {
      visitTopicsPage()
      cy.wait(1500)
    })

    it('renders the configuration selector', () => {
      cy.get('[data-cy="configurations-filter"]').should('be.visible')
    })

    it('renders option "All configurations"', () => {
      cy.get('[data-cy="configurations-filter"]')
        .click()
        .wait(1500)
        .get('ul')
        .children()
        .eq(0)
        .should('have.text', 'All configurations')
    })

    it('renders all provided configuration options', () => {
      cy.get('[data-cy="configurations-filter"]')
        .click()
        .get('ul')
        .children()
        .eq(1)
        .should('be.visible')
        .and('include.text', '2024 Spring')
      cy.get('ul').children().eq(2).should('be.visible').and('include.text', '2023 Autumn')
    })
  })

  describe('default configuration selected while loading Topics page', () => {
    beforeEach(() => {
      visitTopicsPage()
      cy.wait(2500)
    })

    it('after loading the topics page, latest configuration should be selected', () => {
      cy.window().its('store').invoke('getState').its('topicListPage.filter').should('eq', 5)
    })

    it('after loading the topics page, message should be rendered without topics', () => {
      cy.get('h1').should('be.visible').and('have.text', 'None available')
    })
  })

  describe('topics', () => {
    const toggleTestTopicName = 'Aihe C'

    beforeEach(() => {
      visitTopicsPage()
      cy.wait(2500)
      cy.get('[data-cy="configurations-filter"]').click()
      cy.get('[data-cy="configurations-1-"]').click()
    })

    it('renders the topic names correctly', () => {
      const topicTitles = ['Aihe A', 'Aihe B']

      for (const topicTitle of topicTitles) {
        cy.get(`[data-cy-topic-name="${topicTitle}"]`)
          .wait(2500)
          .find('.topic-table-row__topic-title')
          .should('have.text', topicTitle)
      }
    })

    it('renders the customer names and emails correctly', () => {
      cy.get('[data-cy-topic-name="Aihe A"]')
        .wait(2500)
        .find('.topic-table-row__customer')
        .contains('Aasiakas')
      cy.get('[data-cy-topic-name="Aihe A"]')
        .wait(2500)
        .find('.topic-table-row__customer')
        .contains('aasia@kas')
    })

    it('toggles topic active state correctly', () => {
      // get initial checked state
      findTopicActiveCheckbox(toggleTestTopicName).then(($input) => {
        const desiredState = $input.prop('checked') ? 'not.be.checked' : 'be.checked'

        // toggle active
        findTopicActiveCheckbox(toggleTestTopicName).click()

        // did it change state?
        findTopicActiveCheckbox(toggleTestTopicName).should(desiredState)

        visitTopicsPage()
        cy.wait(2500)
        cy.get('[data-cy="configurations-filter"]').click()
        cy.get('[data-cy="configurations-1-"]').click()

        // still in correct state after refresh?
        findTopicActiveCheckbox(toggleTestTopicName).should(desiredState)
      })
    })

    it('renders correct number of topics', () => {
      cy.get('tbody').children().should('have.length', 5)
    })

    it('renders topics in correct order', () => {
      cy.get('tbody').children().eq(0).invoke('attr', 'data-cy-topic-name').should('eq', 'Aihe A')
      cy.get('tbody').children().eq(1).invoke('attr', 'data-cy-topic-name').should('eq', 'Aihe B')
      cy.get('tbody')
        .children()
        .eq(2)
        .invoke('attr', 'data-cy-topic-name')
        .should('eq', 'Ohjelmistotuotantoprojektin laajennus')

      // Restore Aihe C to its original Active state to prevent test pollution in subsequent runs!
      findTopicActiveCheckbox('Aihe C').click()
    })
  })

  describe('emails', () => {
    // from seed "page-access-seeds"
    const topicName = 'Aihe A'
    const topicSecretId = 'eec0neeT0jo0ae9F'
    const secretReviewLink = `https://study.cs.helsinki.fi/projekti/customer-review/${topicSecretId}`

    beforeEach(() => {
      cy.deleteSentEmails()
      cy.updateAllEmailTemplates({
        topicAccepted: {
          finnish: 'Projekti {{topicName}} hyväksytty.',
          english: 'Project {{topicName}} was accepted.',
        },
        topicRejected: {
          finnish: 'Projekti {{topicName}} hylätty.',
          english: 'Project {{topicName}} was rejected.',
        },
        customerReviewLink: {
          finnish: 'Arviointi on nyt auki projektille {{topicName}} osoitteessa {{secretLink}}',
          english: 'Review is now open for project {{topicName}}, go to {{secretLink}}',
        },
      })
      visitTopicsPage({
        // spy window.confirm for email preview tests
        onBeforeLoad(win) {
          cy.spy(win, 'confirm')
        },
      })
      cy.wait(2500)
      cy.get('[data-cy="configurations-filter"]').click()
      cy.get('[data-cy="configurations-1-"]').click()
    })

    it('shows email languages after clicking accept', () => {
      clickSendAcceptEmail(topicName)

      cy.get('[data-cy="email-language-menu"]')
        .should('be.visible')
        .and('have.descendants', '[data-cy-send-mail-lang="finnish"]')
        .and('have.descendants', '[data-cy-send-mail-lang="english"]')
    })

    it('shows email languages after clicking reject', () => {
      clickSendRejectEmail(topicName)

      cy.get('[data-cy="email-language-menu"]')
        .should('be.visible')
        .and('have.descendants', '[data-cy-send-mail-lang="finnish"]')
        .and('have.descendants', '[data-cy-send-mail-lang="english"]')
    })

    it('shows email languages after clicking send customer review link', () => {
      clickSendReviewLinkEmail(topicName)

      cy.get('[data-cy="email-language-menu"]')
        .should('be.visible')
        .and('have.descendants', '[data-cy-send-mail-lang="finnish"]')
        .and('have.descendants', '[data-cy-send-mail-lang="english"]')
    })

    it('shows a success popup after sending an email', () => {
      clickSendAcceptEmail(topicName)
      clickEmailLanguage('finnish')

      cy.get('.notification').contains('Email sent!')
    })

    it('shows a success popup after re-sending an email', () => {
      clickSendAcceptEmail(topicName)
      clickEmailLanguage('finnish')
      cy.get('.notification').contains('Email sent!')

      clickSendAcceptEmail(topicName)
      clickEmailLanguage('finnish')
      cy.get('.notification').contains('Email sent!')
    })

    describe('accept/reject buttons', () => {
      it('changes accept button text to "resend accept" after sending', () => {
        getSendAcceptButton(topicName).should('have.text', 'Accept')

        clickSendAcceptEmail(topicName)
        clickEmailLanguage('finnish')

        getSendAcceptButton(topicName).should('have.text', 'Resend Accept')
      })

      it('changes reject button text to "resend reject" after sending', () => {
        getSendRejectButton(topicName).should('have.text', 'Reject')

        clickSendRejectEmail(topicName)
        clickEmailLanguage('finnish')

        getSendRejectButton(topicName).should('have.text', 'Resend Reject')
      })

      it('does not change the buttons of another topic after sending accept and reject', () => {
        getSendAcceptButton('Aihe B').should('have.text', 'Accept')
        getSendRejectButton('Aihe B').should('have.text', 'Reject')

        clickSendAcceptEmail('Aihe A')
        clickEmailLanguage('english')
        clickSendRejectEmail('Aihe A')
        clickEmailLanguage('english')

        getSendAcceptButton('Aihe B').should('have.text', 'Accept')
        getSendRejectButton('Aihe B').should('have.text', 'Reject')
      })
    })

    describe('filtering by acceptance status', () => {
      it('shows all topics after setting the filter to "All"', () => {
        cy.get('[data-cy="acceptance-filter-all"]').click()
        cy.get('tbody').children().should('have.length', 5)
      })
      it('shows message if no topics are found after filtering', () => {
        cy.wait(2500)
        cy.get('[data-cy="acceptance-filter-rejected"]').click()
        cy.wait(2500)
        cy.get('h1').should('be.visible').and('have.text', 'None available')
        cy.get('[data-cy="acceptance-filter-accepted"]').click()
        cy.wait(2500)
        cy.get('h1').should('be.visible').and('have.text', 'None available')
      })
      it('shows only accepted topics after filtering', () => {
        clickSendAcceptEmail('Aihe A')
        clickEmailLanguage('finnish')
        cy.get('[data-cy="acceptance-filter-accepted"]').click()
        cy.wait(2500)
        cy.get('tbody').children().should('have.length', 1)
      })
      it('shows only rejected topics after filtering', () => {
        clickSendRejectEmail('Aihe B')
        clickEmailLanguage('finnish')
        cy.get('[data-cy="acceptance-filter-rejected"]').click()
        cy.wait(2500)
        cy.get('tbody').children().should('have.length', 1)
      })
    })

    describe('customer review button', () => {
      it('changes send link text to send reminder after sending', () => {
        getSendReviewLinkButton(topicName).should('have.text', 'Send link')

        clickSendReviewLinkEmail(topicName)
        clickEmailLanguage('finnish')

        getSendReviewLinkButton(topicName).should('have.text', 'Send reminder')
      })

      it('does not change the buttons of another topic after sending link', () => {
        getSendReviewLinkButton('Aihe B').should('have.text', 'Send link')

        clickSendReviewLinkEmail('Aihe A')
        clickEmailLanguage('english')

        getSendReviewLinkButton('Aihe B').should('have.text', 'Send link')
      })
    })

    describe('email preview', () => {
      it('shows the correctly rendered email confirm for topic accepted (finnish) template', () => {
        clickSendAcceptEmail(topicName)
        clickEmailLanguage('finnish')
        cy.window()
          .its('confirm')
          .should((confirmSpy) => {
            expect(confirmSpy.callCount).to.equal(1)
            expect(confirmSpy.getCall(0).args[0]).to.contain(`Projekti ${topicName} hyväksytty.`)
          })
      })

      it('shows the correctly rendered email confirm for topic accepted (english) template', () => {
        clickSendAcceptEmail(topicName)
        clickEmailLanguage('english')
        cy.window()
          .its('confirm')
          .should((confirmSpy) => {
            expect(confirmSpy.callCount).to.equal(1)
            expect(confirmSpy.getCall(0).args[0]).to.contain(`Project ${topicName} was accepted.`)
          })
      })

      it('shows the correctly rendered email confirm for topic rejected (finnish) template', () => {
        clickSendRejectEmail(topicName)
        clickEmailLanguage('finnish')
        cy.window()
          .its('confirm')
          .should((confirmSpy) => {
            expect(confirmSpy.callCount).to.equal(1)
            expect(confirmSpy.getCall(0).args[0]).to.contain(`Projekti ${topicName} hylätty.`)
          })
      })

      it('shows the correctly rendered email confirm for topic rejected (english) template', () => {
        clickSendRejectEmail(topicName)
        clickEmailLanguage('english')
        cy.window()
          .its('confirm')
          .should((confirmSpy) => {
            expect(confirmSpy.callCount).to.equal(1)
            expect(confirmSpy.getCall(0).args[0]).to.contain(`Project ${topicName} was rejected.`)
          })
      })

      it('shows the correctly rendered email confirm for customer review link (finnish)', () => {
        clickSendReviewLinkEmail(topicName)
        clickEmailLanguage('finnish')
        cy.window()
          .its('confirm')
          .should((confirmSpy) => {
            expect(confirmSpy.callCount).to.equal(1)
            expect(confirmSpy.getCall(0).args[0]).to.contain(
              `Arviointi on nyt auki projektille ${topicName} osoitteessa ${secretReviewLink}`,
            )
          })
      })

      it('shows the correctly rendered email confirm for customer review link (english)', () => {
        clickSendReviewLinkEmail(topicName)
        clickEmailLanguage('english')
        cy.window()
          .its('confirm')
          .should((confirmSpy) => {
            expect(confirmSpy.callCount).to.equal(1)
            expect(confirmSpy.getCall(0).args[0]).to.contain(
              `Review is now open for project ${topicName}, go to ${secretReviewLink}`,
            )
          })
      })
    })
  })
})
