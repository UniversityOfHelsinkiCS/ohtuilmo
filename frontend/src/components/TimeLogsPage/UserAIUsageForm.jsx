import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Radio,
  Button,
  CircularProgress,
  Typography,
  TextField,
} from '@mui/material'
import {
  updateAIUsageAnswers,
  createAIUsageAnswers,
} from '../../reducers/actions/userAIUsageActions'
import { useEffect } from 'react'
import Markdown from '../common/Markdown'

const initialModelsUsed = {
  claude: false,
  curreChat: false,
  cursor: false,
  copilot: false,
  codex: false,
  other: false,
  otherExamples: '',
}
// options none | consult | generate
const initialHowUsed = {
  understandCode: 'none',
  debugging: 'none',
  features: 'none',
  refactoring: 'none',
  codeReview: 'none',
  planning: 'none',
  uiPlanning: 'none',
  documentation: 'none',
  tests: 'none',
  databases: 'none',
  infra: 'none',
}

const modelNames = {
  claude: 'Claude Code',
  curreChat: 'CurreChat',
  cursor: 'Cursor',
  copilot: 'GitHub Copilot',
  codex: 'OpenAI Codex',
  other: 'Muita malleja',
}
// TODO move texts to localization files when created
const questionInfos = {
  what: 'Mitä tekoälymalleja käytit sprintin aikana?',
  main: 'Mihin ja miten käytit generatiivista tekoälyä?',
  mainInfo:
    'Jos käytit tekoälyä enimmäkseen konsulttina (kysyit neuvoa, ideoita tai pieniä koodinpätkiä), ' +
    'mutta **implementoit muutoksia enimmäkseen omakätisesti**, valitse `Konsultoin tekoälyä`. ' +
    'Jos **generoit merkittävän osan** projektiin tuottamastasi koodista/tekstistä tekoälyllä ' +
    '(suoraan agentilla tai kopioit chatista) valitse `Generoin tekoälyllä`.',
}

const questions = {
  understandCode: 'Olemassaolevan koodin ymmärtäminen (oman tai muiden)',
  debugging: 'Debuggaus tai ongelman paikantaminen',
  features: 'Uuden koodin (toiminnallisuuksien) luominen',
  refactoring: 'Olemassaolevan koodin muokkaaminen (esim. virheenkorjaus, toiminnan laajentaminen)',
  codeReview: 'Koodikatselmointi (esim. \textit{pull requestien} arviointi)',
  planning:
    'Arkkitehtuurin suunnittelu ja toteutus (esim. käytetyt teknologiat, projektin rakenne)',
  uiPlanning: 'Käyttöliittymän suunnittelu ja toteutus',
  documentation: 'Dokumentaation tuottaminen',
  tests: 'Testien tuottaminen',
  databases: 'Infrastruktuurin toteutus ja hallinta (esim. CI/CD-ratkaisut, ympäristöt)',
  infra: 'Tietokannat (esim. hallinta, kyselyt)',
}

const usageOptions = {
  none: 'En käyttänyt',
  consult: 'Konsultoin tekoälyä',
  generating: 'Generoin tekoälyllä',
}

const ModelRow = ({ modelsUsed, setModelsUsed, changesDisabled }) => {
  const [otherModels, setOtherModels] = useState('')
  const handeModelsUsed = (event) => {
    const valueParts = event.target.value.split('-')
    if (valueParts[1] !== 'otherExamples') {
      modelsUsed[valueParts[0]] = valueParts[1] === 'used'
      setModelsUsed({ ...modelsUsed })
    } else if (valueParts[1] === 'otherExamples') {
      setModelsUsed({
        ...modelsUsed,
        otherExamples: modelsUsed.otherExamples.concat(`, ${valueParts[0]}`),
      })
    }
  }

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tekoälymalli</TableCell>
            <TableCell>En käyttänyt</TableCell>
            <TableCell>Käytin</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(modelsUsed).map((model) => {
            return (
              model !== 'otherExamples' && (
                <TableRow key={model}>
                  <TableCell>{modelNames[model]}</TableCell>
                  <TableCell>
                    <Radio
                      disabled={changesDisabled}
                      value={`${model}-notUsed`}
                      checked={!modelsUsed[model]}
                      slotProps={{
                        input: { 'aria-label': `${modelNames[model]}-not-used` },
                      }}
                      onChange={handeModelsUsed}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      disabled={changesDisabled}
                      value={`${model}-used`}
                      checked={modelsUsed[model]}
                      slotProps={{
                        input: { 'aria-label': `${modelNames[model]}-used` },
                      }}
                      onChange={handeModelsUsed}
                    />
                  </TableCell>
                </TableRow>
              )
            )
          })}
        </TableBody>
      </Table>
      <br />
      <Typography variant="h6">Jos käytit lisäksi muita malleja, niin mitä ne olivat.</Typography>
      <Typography sx={{ fontWeight: 800 }}>{modelsUsed['otherExamples']}</Typography>
      <br />
      <TextField
        disabled={changesDisabled}
        fullWidth
        value={otherModels}
        placeholder="Muita malleja"
        error={(modelsUsed.otherExamples + ` , ${otherModels}`).length > 250}
        label={
          (modelsUsed.otherExamples + ` , ${otherModels}`).length > 250
            ? 'Lisäämäsi mallien yhteenlaskettu pituus ylittää 250 merkkiä'
            : ''
        }
        onChange={(event) => setOtherModels(event.target.value)}
      />
      <Button
        disabled={changesDisabled || (modelsUsed.otherExamples + ` , ${otherModels}`).length > 250}
        sx={{ marginTop: 2, color: 'black', background: 'lightblue' }}
        value={`${otherModels}-otherExamples`}
        onClick={handeModelsUsed}
      >
        Lisää muita malleja
      </Button>
    </>
  )
}

const HowUsedRow = ({ howUsed, setHowUsed, changesDisabled }) => {
  const handeHowUsed = (event) => {
    const value = event.target.value.split('-')
    const question = value[0]
    howUsed[question] = value[1]
    setHowUsed({ ...howUsed })
  }
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: 250 }}>Kohde</TableCell>
          {Object.keys(usageOptions).map((option) => {
            return (
              <TableCell sx={{ width: 150 }} key={option}>
                {usageOptions[option]}
              </TableCell>
            )
          })}
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.keys(howUsed).map((question) => {
          return (
            <TableRow key={question}>
              <TableCell sx={{ width: 250 }}>{questions[question]}</TableCell>
              <TableCell sx={{ width: 150 }}>
                <Radio
                  disabled={changesDisabled}
                  onChange={handeHowUsed}
                  value={`${question}-none`}
                  checked={howUsed[question] === 'none'}
                />
              </TableCell>
              <TableCell sx={{ width: 150 }}>
                <Radio
                  disabled={changesDisabled}
                  onChange={handeHowUsed}
                  value={`${question}-consult`}
                  checked={howUsed[question] === 'consult'}
                />
              </TableCell>
              <TableCell sx={{ width: 150 }}>
                <Radio
                  disabled={changesDisabled}
                  onChange={handeHowUsed}
                  value={`${question}-generate`}
                  checked={howUsed[question] === 'generate'}
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export const UserAIUsageForm = ({ currentSprint, groupId, selectedSprint }) => {
  const sprintData = useSelector((state) => state.userAIUsage?.answersStudent)
  const [modelsUsed, setModelsUsed] = useState(initialModelsUsed)
  const [howUsed, setHowUsed] = useState(initialHowUsed)
  const dispatch = useDispatch()

  useEffect(() => {
    if (sprintData) {
      const currentSprintData = sprintData.filter((usage) => usage.sprintId === selectedSprint)[0]
      if (currentSprintData) {
        setHowUsed(currentSprintData.howUsed)
        setModelsUsed(currentSprintData.modelsUsed)
      } else {
        setHowUsed(initialHowUsed)
        setModelsUsed(initialModelsUsed)
      }
    }
  }, [sprintData, selectedSprint])

  const handledSave = async () => {
    if (sprintData && sprintData.sprintId === selectedSprint) {
      const dataToUpdate = {
        sprint: selectedSprint,
        howUsed,
        modelsUsed,
      }
      dispatch(updateAIUsageAnswers(dataToUpdate, selectedSprint))
    } else {
      const dataToSave = {
        sprint: selectedSprint,
        howUsed,
        modelsUsed,
        groupId,
      }
      dispatch(createAIUsageAnswers(dataToSave))
    }
  }
  if (!modelsUsed || !howUsed) return <CircularProgress />

  return (
    <>
      <Typography variant="h5">Sprintin aikainen tekoälyn käyttö</Typography>
      <Markdown>
        **Voit päivittää vastauksiasi koko sprintin ajan. Muista tallettaa valintasi.**
      </Markdown>
      <Typography variant="h6">{questionInfos['what']}</Typography>
      <ModelRow
        modelsUsed={modelsUsed}
        setModelsUsed={setModelsUsed}
        changesDisabled={currentSprint !== selectedSprint}
      />
      <Typography variant="h5">{questionInfos.main}</Typography>
      <Markdown>{questionInfos.mainInfo}</Markdown>
      <HowUsedRow
        howUsed={howUsed}
        setHowUsed={setHowUsed}
        changesDisabled={currentSprint !== selectedSprint}
      />
      <br />
      <Button
        disabled={currentSprint !== selectedSprint}
        sx={{ marginBottom: 1, color: 'black', background: 'lightblue' }}
        aria-label="Tallenna tekoälyvastaukset"
        onClick={() => handledSave()}
      >
        Tallenna tekoälyvastaukset
      </Button>
    </>
  )
}
