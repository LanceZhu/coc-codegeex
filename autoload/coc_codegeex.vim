let s:has_vim_ghost_text = has('patch-9.0.0185') && has('textprop')

let s:hlgroup = 'CodegeexSuggestion'

if s:has_vim_ghost_text && empty(prop_type_get(s:hlgroup))
  call prop_type_add(s:hlgroup, {'highlight': s:hlgroup})
endif

function! coc_codegeex#init() abort
   echo "coc_codegeex#init" 
endfunction

function! coc_codegeex#UpdatePreview(items) abort
  try
   " let text = ['line1', 'line2', 'line3']
    let text = a:items
   let trail = strpart(getline('.'), col('.') - 1)
   call prop_add(line('.'), col('.'), {'type': s:hlgroup, 'text': text[0]})
   for line in text[1:]
     call prop_add(line('.'), 0, {'type': s:hlgroup, 'text_align': 'below', 'text': line})
   endfor
  catch
    return
  endtry
endfunction

function! coc_codegeex#ClearPreview() abort
  hi def CodegeexSuggestion guifg=#808080 ctermfg=8
  let s:hlgroup = 'CodegeexSuggestion'
  call prop_remove({'type': s:hlgroup, 'all': v:true})
endfunction
