" if exists("g:loaded_coc_codegeex")
"   finish
" endif
" let g:loaded_coc_codegeex = 2

function! s:ColorScheme() abort
  hi def CodegeexSuggestion guifg=#808080 ctermfg=8
endfunction

augroup coc_codegeex 
  autocmd!
  autocmd ColorScheme,VimEnter * call s:ColorScheme()
  autocmd InsertLeave * call coc_codegeex#ClearPreview()
  autocmd BufLeave * call coc_codegeex#ClearPreview()
  autocmd InsertEnter * call coc_codegeex#ClearPreview()
  autocmd CompleteChanged * call coc_codegeex#ClearPreview()
augroup END

call s:ColorScheme()
