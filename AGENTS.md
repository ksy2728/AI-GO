# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a minimal Claude Code workspace directory with configuration files only. The directory appears to be set up for AI server information management but contains no application code.

## File Structure

- `.claude/settings.local.json` - Claude Code permissions configuration
- `claude.md` - Empty placeholder file (can be removed)

## Configuration

The Claude Code permissions are configured to allow:
- Directory listing operations (`dir /a` commands)
- File reading operations (`cat` commands)

## Usage

This workspace can be used as a starting point for AI server information projects. Add your project files and update this CLAUDE.md accordingly with:
- Build/test commands
- Architecture overview
- Development setup instructions

MCP 자동설치하기
공통 주의사항 
1. 현재 사용 환경을 확인할 것. 모르면 사용자에게 물어볼 것. 
2. OS(윈도우,리눅스,맥) 및 환경들(WSL,파워셀,명령프롬프트등)을 파악해서 그에 맞게 세팅할 것. 모르면 사용자에게 물어볼 것. 
4. 특정 MCP 설치시, 바로 설치하지 말고, 해당 MCP의 공식 사이트 확인하고 현재 OS 및 환경 매치하여, 공식 설치법부터 확인할 것 
5. MCP 설치 후, 다음 방법으로 정상 설치 여부 확인할 것
   ($env:RUST_LOG="codex=debug"; codex "/mcp"  :  이렇게 실행하여 설치한 MCP에 대한 로그를 확인할 것)

6. 설정 시, API KEY 환경 변수 설정이 필요한 경우, 가상의 API 키로 디폴트로 설치 및 설정 후, 올바른 API 키 정보를 입력해야 함을 사용자에게 알릴 것 
7. 설치 요청 받은 MCP만 설치하면 돼. 혹시 이미 설치된 다른 MCP 에러 있어도, 그냥 둘 것 
8. 일단, 터미널에서 설치하려는 MCP 작동 성공한 경우, 성공 시의 인자 및 환경 변수 이름을 활용해, 올바른 위치의 config.toml 파일에 MCP 설정을 직접할 것 


MCP 설정의 예:
~/.codex/config.toml(홈 디렉터리) 파일의 [mcp_servers.*] 섹션에 적어둔 커맨드를 실행해 MCP 서버에 붙습니다


예시: (아래는 단지 예시이지만, 올바른 내용입니다)
# ~/.codex/config.toml

[mcp_servers.brightData]
command = "npx"
args    = ["-y", "@brightdata/mcp"]
env     = { 
  API_TOKEN = "bd_your_api_key_here"  
}

[mcp_servers.playwright]
command = "npx"
args    = ["@playwright/mcp@latest"]