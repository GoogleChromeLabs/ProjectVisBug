export const desiredPropMap = {
  color:                'rgb(0, 0, 0)',
  backgroundColor:      'rgba(0, 0, 0, 0)',
  backgroundImage:      'none',
  backgroundSize:       'auto',
  backgroundPosition:   '0% 0%',
  // borderColor:          'rgb(0, 0, 0)',
  borderWidth:          '0px',
  borderRadius:         '0px',
  boxShadow:            'none',
  padding:              '0px',
  margin:               '0px',
  fontFamily:           '',
  fontSize:             '16px',
  fontWeight:           '400',
  textAlign:            'start',
  textShadow:           'none',
  textTransform:        'none',
  lineHeight:           'normal',
  letterSpacing:        'normal',
  display:              'block',
  alignItems:           'normal',
  justifyContent:       'normal',
  fill:                 'rgb(0, 0, 0)',
  stroke:               'none',
}

if (navigator.userAgent.search('Firefox')) {
  desiredPropMap.backgroundSize = 'auto auto'
  desiredPropMap.borderWidth    = ''
  desiredPropMap.borderRadius   = ''
  desiredPropMap.padding        = ''
  desiredPropMap.margin         = ''
}

export const desiredAccessibilityMap = [
  'role',
  'tabindex',
  'aria-*',
  'for',
  'alt',
  'title',
]