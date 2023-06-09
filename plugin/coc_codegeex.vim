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
augroup END

call s:ColorScheme()
