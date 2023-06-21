if exists("g:loaded_coc_codegeex")
  finish
endif
let g:loaded_coc_codegeex = 1

function! s:ColorScheme() abort
  hi def CodegeexSuggestion guifg=#808080 ctermfg=8
endfunction

augroup coc_codegeex 
  autocmd!
  autocmd ColorScheme,VimEnter * call s:ColorScheme()
  autocmd InsertLeave * call coc_codegeex#ClearPreview()
  autocmd BufLeave * call coc_codegeex#ClearPreview()
  autocmd InsertEnter * call coc_codegeex#ClearPreview()
  autocmd BufEnter * call coc_codegeex#ClearPreview()
  autocmd CompleteChanged * call coc_codegeex#ClearPreview()
augroup END

function! coc_codegeex#ArrowDown() abort
  call coc_codegeex#ClearPreview()
  return coc#pum#next(0)
endfunction

function! coc_codegeex#ArrowUp() abort
  call coc_codegeex#ClearPreview()
  return coc#pum#prev(0)
endfunction

" Default key-mappings for completion
inoremap <silent><expr> <down> coc#pum#visible() ? coc_codegeex#ArrowDown() : "\<down>"
inoremap <silent><expr> <up> coc#pum#visible() ? coc_codegeex#ArrowUp() : "\<up>"

call s:ColorScheme()

