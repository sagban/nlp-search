import React from "react";

const LanguageSelector = (props) => {
    const {langValue, setLangValue} = props;
    return (
        <>
            <label htmlFor="Select Language" className='label'>Language *</label>
            <select className="form-select input" aria-label="Default select example" name="Select Language"
                    onChange={e => setLangValue(e.target.value)}>
                <option value={-1} selected={langValue === -1}>English</option>
                <option value={0} selected={langValue === 0}>Aragonese</option>
                <option value={1} selected={langValue === 1}>Catalan</option>
                <option value={2} selected={langValue === 2}>Corsican</option>
                <option value={4} selected={langValue === 4}>French</option>
                <option value={5} selected={langValue === 5}>Galician</option>
                <option value={6} selected={langValue === 6}>Italian</option>
                <option value={7} selected={langValue === 7}> Latin</option>
                <option value={8} selected={langValue === 8}>Occitan</option>
                <option value={9} selected={langValue === 9}>Portuguese</option>
                <option value={10} selected={langValue === 10}>Romansh</option>
                <option value={11} selected={langValue === 11}>Romanian</option>
                <option value={12} selected={langValue === 12}> Spanish</option>
                <option value={13} selected={langValue === 13}>Wallon</option>
            </select>
        </>
    )
}

export default LanguageSelector;
