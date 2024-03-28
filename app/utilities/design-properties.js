import {isFirefox, isSafari} from './cross-browser.js'

export const desiredPropMap = {
  color:               'rgb(0, 0, 0)',
  backgroundColor:     'rgba(0, 0, 0, 0)',
  backgroundImage:     'none',
  backgroundSize:      'auto',
  backgroundPosition:  '0% 0%',
  borderRadius:        '0px',
  boxShadow:           'none',
  padding:             '0px',
  margin:              '0px',
  fontFamily:          'auto',
  fontSize:            '16px',
  fontWeight:          '400',
  textAlign:           'start',
  textShadow:          'none',
  textTransform:       'none',
  lineHeight:          'normal',
  letterSpacing:       'normal',
  display:             'block',
  alignItems:          'normal',
  justifyContent:      'normal',
  flexDirection:       'row',
  flexWrap:            'nowrap',
  flexBasis:           'auto',
  // flexFlow:         'none',
  fill:                'rgb(0, 0, 0)',
  stroke:              'none',
  gridTemplateColumns: 'none',
  gridAutoColumns:     'auto',
  gridTemplateRows:    'none',
  gridAutoRows:        'auto',
  gridTemplateAreas:   'none',
  gridArea:            'auto',
  gap:                 'normal',
  gridAutoFlow:        'row',
}

if (isFirefox) {
  desiredPropMap.backgroundSize = 'auto'
  desiredPropMap.borderWidth    = ''
  desiredPropMap.borderRadius   = ''
  desiredPropMap.padding        = ''
  desiredPropMap.margin         = ''
  desiredPropMap.gap            = ''
  desiredPropMap.gridArea       = ''
  desiredPropMap.borderColor    = ''
}

if (isSafari) {
  desiredPropMap.gap = 'normal normal'
}

export const desiredAccessibilityMap = [
  'role',
  'tabindex',
  'aria-*',
  'for',
  'alt',
  'title',
  'type',
]

export const largeWCAG2TextMap = [
  {
    fontSize: '24px',
    fontWeight: '0'
  },
  {
    fontSize: '18.5px',
    fontWeight: '700'
  }
]
